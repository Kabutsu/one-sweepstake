import { db } from "@/db";
import { matchCache, tournaments, teamsTournaments } from "@/db/schema";
import { eq, and, lt, ne } from "drizzle-orm";
import { getFootballDataAPI } from "./football-data-api";

export interface UpdateMatchCacheResult {
  updated: number;
  created: number;
  errors: string[];
  success: boolean;
}

/**
 * Fetch and add new matches from football-data.org to the cache.
 * Only creates new matches, does not update existing ones.
 */
export async function updateMatchSchedule(
  tournamentApiId: string
): Promise<UpdateMatchCacheResult> {
  const result: UpdateMatchCacheResult = {
    updated: 0,
    created: 0,
    errors: [],
    success: false,
  };

  try {
    const [tournament] = await db
      .select()
      .from(tournaments)
      .where(eq(tournaments.apiId, tournamentApiId))
      .limit(1);

    if (!tournament) {
      result.errors.push(`Tournament with API ID ${tournamentApiId} not found`);
      return result;
    }

    const footballDataAPI = getFootballDataAPI();
    const matches = await footballDataAPI.fetchMatchesByCompetition(tournamentApiId);
    result.success = true;

    for (const match of matches) {
      try {
        // Skip matches without teams assigned (TBD matches)
        if (!match.homeTeam?.name || !match.awayTeam?.name) {
          continue;
        }

        // Check if match already exists
        const existingMatch = await db
          .select()
          .from(matchCache)
          .where(eq(matchCache.apiMatchId, String(match.id)))
          .limit(1);

        // Only add new matches, don't update existing ones
        if (existingMatch.length === 0) {
          await db.insert(matchCache).values({
            tournamentId: tournament.id,
            apiMatchId: String(match.id),
            homeTeamId: String(match.homeTeam.id),
            awayTeamId: String(match.awayTeam.id),
            homeScore: match.score.fullTime.home,
            awayScore: match.score.fullTime.away,
            status: match.status,
            stage: match.stage ?? null,
            scheduledAt: new Date(match.utcDate),
            rawData: match,
            lastFetchedAt: new Date(),
            updatedAt: new Date(),
          });
          result.created++;
        }
      } catch (error) {
        result.errors.push(
          `Failed to add match ${match.id}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  } catch (error) {
    result.errors.push(
      `Failed to update schedule: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return result;
}

/**
 * Update live match results from football-data.org for matches that kicked off recently.
 * Only updates scores for existing matches that are not yet finished.
 */
export async function updateMatchLiveResults(
  tournamentId: string
): Promise<UpdateMatchCacheResult> {
  const result: UpdateMatchCacheResult = {
    updated: 0,
    created: 0,
    errors: [],
    success: false,
  };

  try {
    const now = new Date();

    // Get tournament info to get apiId
    const [tournament] = await db
      .select()
      .from(tournaments)
      .where(eq(tournaments.id, tournamentId))
      .limit(1);

    if (!tournament) {
      result.errors.push(`Tournament with ID ${tournamentId} not found`);
      return result;
    }

    const knockoutStages = [
      "FINAL",
      "THIRD_PLACE",
      "SEMI_FINALS",
      "QUARTER_FINALS",
      "LAST_16",
      "LAST_32",
    ];

    // Find matches that need live updates
    const allMatches = await db
      .select()
      .from(matchCache)
      .where(
        and(
          eq(matchCache.tournamentId, tournamentId),
          ne(matchCache.status, "FINISHED"),
          lt(matchCache.scheduledAt, now)
        )
      );

    const matchesNeedingUpdate = allMatches.filter((match) => {
      if (match.status === "FINISHED") return false;

      const isGroupStage = match.stage === "GROUP_STAGE";
      const isKnockout = knockoutStages.includes(match.stage || "");

      if (!isGroupStage && !isKnockout && match.stage) {
        console.warn(`Unexpected stage: ${match.stage} for match ${match.id}`);
      }

      return isGroupStage || isKnockout;
    });

    // Early exit if no matches need updating
    if (matchesNeedingUpdate.length === 0) {
      result.success = true;
      return result;
    }

    // Calculate date range to fetch (from earliest match to now + buffer)
    const earliestMatch = matchesNeedingUpdate.reduce((earliest, match) =>
      new Date(match.scheduledAt) < new Date(earliest.scheduledAt) ? match : earliest
    );
    const dateFrom = new Date(earliestMatch.scheduledAt);
    dateFrom.setHours(0, 0, 0, 0); // Start of day

    const dateTo = new Date(now);
    dateTo.setDate(dateTo.getDate() + 1); // Add buffer for timezone differences

    // Fetch matches from football-data.org
    const footballDataAPI = getFootballDataAPI();
    const matches = await footballDataAPI.fetchMatchesByDateRange(
      tournament.apiId,
      dateFrom.toISOString().split("T")[0],
      dateTo.toISOString().split("T")[0]
    );

    // Create a map of matches that need updating for faster lookup
    const matchesToUpdateMap = new Map(matchesNeedingUpdate.map((m) => [m.apiMatchId, m]));

    // Update matches
    for (const match of matches) {
      const cachedMatch = matchesToUpdateMap.get(String(match.id));
      if (!cachedMatch) continue;

      try {
        let homeScore = match.score.fullTime.home;
        let awayScore = match.score.fullTime.away;

        if (knockoutStages.includes(match.stage || "")) {
          const isExtraTime = match.score.regularTime && match.score.extraTime;

          if (isExtraTime) {
            homeScore =
              (match.score.fullTime.home || 0) +
              (match.score.regularTime!.home || 0) +
              (match.score.extraTime!.home || 0);
            awayScore =
              (match.score.fullTime.away || 0) +
              (match.score.regularTime!.away || 0) +
              (match.score.extraTime!.away || 0);
          }
        }

        await db
          .update(matchCache)
          .set({
            homeScore,
            awayScore,
            status: match.status,
            rawData: match,
            lastFetchedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(matchCache.id, cachedMatch.id));

        if (
          match.status === "FINISHED" &&
          knockoutStages.includes(match.stage || "") &&
          match.score.fullTime.home !== null &&
          match.score.fullTime.away !== null
        ) {
          // Determine losing team and mark as eliminated
          const losingTeamId =
            match.score.fullTime.home > match.score.fullTime.away
              ? String(match.awayTeam.id)
              : String(match.homeTeam.id);

          await db
            .update(teamsTournaments)
            .set({ isEliminated: true })
            .where(
              and(
                eq(teamsTournaments.teamId, losingTeamId),
                eq(teamsTournaments.tournamentId, tournamentId)
              )
            );
        }

        result.updated++;
      } catch (error) {
        result.errors.push(
          `Failed to update match ${match.id}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    result.success = true;
  } catch (error) {
    result.errors.push(
      `Failed to update live results: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return result;
}

/**
 * @deprecated Use updateMatchSchedule() and updateMatchLiveResults() separately
 * Legacy function that calls both schedule and live results updates
 */
export async function updateMatchCache(tournamentApiId: string): Promise<UpdateMatchCacheResult> {
  const scheduleResult = await updateMatchSchedule(tournamentApiId);

  // Get tournament ID from API ID
  const [tournament] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.apiId, tournamentApiId))
    .limit(1);

  if (!tournament) {
    return scheduleResult;
  }

  const liveResult = await updateMatchLiveResults(tournament.id);

  return {
    created: scheduleResult.created,
    updated: liveResult.updated,
    errors: [...scheduleResult.errors, ...liveResult.errors],
    success: scheduleResult.success && liveResult.success,
  };
}

export async function shouldPollMatches(tournamentId: string): Promise<boolean> {
  const [tournament] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.id, tournamentId))
    .limit(1);

  if (!tournament) {
    return false;
  }

  const now = new Date();
  const startDate = new Date(tournament.startDate);
  const endDate = new Date(tournament.endDate);

  // Start polling 30 days before tournament starts
  const cacheStartDate = new Date(startDate);
  cacheStartDate.setDate(cacheStartDate.getDate() - 30);

  return now >= cacheStartDate && now <= endDate;
}

export interface PollingRecommendation {
  shouldPoll: boolean;
  intervalMinutes: number;
  reason: string;
  tournamentPhase: "pre-tournament" | "active" | "post-tournament" | "outside-window";
}

export async function getPollingRecommendation(
  tournamentId: string
): Promise<PollingRecommendation> {
  const [tournament] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.id, tournamentId))
    .limit(1);

  if (!tournament) {
    return {
      shouldPoll: false,
      intervalMinutes: 0,
      reason: "Tournament not found",
      tournamentPhase: "outside-window",
    };
  }

  const now = new Date();
  const startDate = new Date(tournament.startDate);
  const endDate = new Date(tournament.endDate);

  const cacheStartDate = new Date(startDate);
  cacheStartDate.setDate(cacheStartDate.getDate() - 30);

  // Outside polling window
  if (now < cacheStartDate || now > endDate) {
    return {
      shouldPoll: false,
      intervalMinutes: 0,
      reason: "Outside polling window (30 days before start to end date)",
      tournamentPhase: "outside-window",
    };
  }

  // Pre-tournament: poll once daily (1440 minutes)
  if (now < startDate) {
    return {
      shouldPoll: true,
      intervalMinutes: 1440,
      reason: "Pre-tournament phase: matches may be scheduled or updated",
      tournamentPhase: "pre-tournament",
    };
  }

  // Post-tournament: poll once daily for final results
  if (now > endDate) {
    const daysSinceEnd = Math.floor((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceEnd <= 2) {
      return {
        shouldPoll: true,
        intervalMinutes: 1440,
        reason: "Just ended: polling once daily for final results",
        tournamentPhase: "post-tournament",
      };
    }
    return {
      shouldPoll: false,
      intervalMinutes: 0,
      reason: "Tournament ended more than 2 days ago",
      tournamentPhase: "post-tournament",
    };
  }

  // Active tournament: poll every 2 minutes for live scores
  return {
    shouldPoll: true,
    intervalMinutes: 2,
    reason: "Tournament in progress: frequent polling for live scores",
    tournamentPhase: "active",
  };
}
