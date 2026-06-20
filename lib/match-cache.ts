import { db } from "@/db";
import { matchCache, tournaments, teams, teamsTournaments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getFootballDataAPI } from "./football-data-api";
import { calculateEliminationWithRankings, Match } from "./elimination-tracker";

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
    const groupStageWindow = 2.5 * 60 * 60 * 1000; // 2.5 hours in ms
    const knockoutWindow = 3.5 * 60 * 60 * 1000; // 3.5 hours in ms

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

    // Find matches that need live updates
    const allMatches = await db
      .select()
      .from(matchCache)
      .where(eq(matchCache.tournamentId, tournamentId));

    const matchesNeedingUpdate = allMatches.filter((match) => {
      if (match.status === "FINISHED") return false;

      const kickoffTime = new Date(match.scheduledAt).getTime();
      const timeSinceKickoff = now.getTime() - kickoffTime;

      const isGroupStage = match.stage === "GROUP_STAGE";
      const knockoutStages = [
        "FINAL",
        "THIRD_PLACE",
        "SEMI_FINALS",
        "QUARTER_FINALS",
        "LAST_16",
        "LAST_32",
      ];
      const isKnockout = knockoutStages.includes(match.stage || "");

      if (!isGroupStage && !isKnockout && match.stage) {
        console.warn(`Unexpected stage: ${match.stage} for match ${match.id}`);
      }

      if (isGroupStage && timeSinceKickoff > 0 && timeSinceKickoff <= groupStageWindow) {
        return true;
      }

      if (isKnockout && timeSinceKickoff > 0 && timeSinceKickoff <= knockoutWindow) {
        return true;
      }

      return false;
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
        await db
          .update(matchCache)
          .set({
            homeScore: match.score.fullTime.home,
            awayScore: match.score.fullTime.away,
            status: match.status,
            rawData: match,
            lastFetchedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(matchCache.id, cachedMatch.id));

        result.updated++;
      } catch (error) {
        result.errors.push(
          `Failed to update match ${match.id}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // After updating matches, recalculate elimination status if any matches were updated
    if (result.updated > 0) {
      try {
        await updateEliminationStatus(tournamentId);
      } catch (error) {
        result.errors.push(
          `Failed to update elimination status: ${error instanceof Error ? error.message : String(error)}`
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

/**
 * Update elimination status for all teams in a tournament
 * Called after match results are updated
 */
async function updateEliminationStatus(tournamentId: string): Promise<void> {
  // Get all matches for the tournament
  const matchRecords = await db
    .select()
    .from(matchCache)
    .where(eq(matchCache.tournamentId, tournamentId));

  // Get all teams with their rankings
  const teamRecords = await db
    .select({
      teamId: teamsTournaments.teamId,
      ranking: teamsTournaments.ranking,
    })
    .from(teamsTournaments)
    .where(eq(teamsTournaments.tournamentId, tournamentId));

  // Build rankings map
  const teamRankings = new Map<string, number>();
  for (const team of teamRecords) {
    if (team.ranking) {
      teamRankings.set(team.teamId, team.ranking);
    }
  }

  // Get team names for enrichment
  const allTeams = await db.select().from(teams);
  const teamsMap = new Map(allTeams.map((t) => [t.id, t]));

  // Enrich matches with team names
  const enrichedMatches: Match[] = matchRecords.map((match) => ({
    apiMatchId: match.apiMatchId,
    homeTeamId: match.homeTeamId,
    homeTeamName: teamsMap.get(match.homeTeamId)?.name || match.homeTeamId,
    awayTeamId: match.awayTeamId,
    awayTeamName: teamsMap.get(match.awayTeamId)?.name || match.awayTeamId,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    status: match.status,
    stage: match.stage,
    rawData: match.rawData,
  }));

  // Calculate elimination status
  const eliminationStatus = calculateEliminationWithRankings(enrichedMatches, teamRankings);

  // Update database
  for (const [teamId, isEliminated] of eliminationStatus) {
    await db
      .update(teamsTournaments)
      .set({ isEliminated })
      .where(
        and(eq(teamsTournaments.teamId, teamId), eq(teamsTournaments.tournamentId, tournamentId))
      );
  }
}
