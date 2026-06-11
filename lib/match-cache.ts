import { db } from "@/db";
import { matchCache, tournaments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getFootballDataAPI } from "./football-data-api";
import {
  getAPIFootballClient,
  mapAPIFootballStatus,
  loadTeamMappings,
  type APIFootballMatch,
} from "./api-football";

export interface UpdateMatchCacheResult {
  updated: number;
  created: number;
  deleted: number;
  errors: string[];
  footballDataSuccess: boolean;
  apiFootballSuccess: boolean;
  liveMatchesUpdated: number;
}

export async function cleanupOldMatches(tournamentId: string): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 days ago

  const oldMatches = await db
    .select()
    .from(matchCache)
    .where(eq(matchCache.tournamentId, tournamentId));

  const matchesToDelete = oldMatches.filter(
    (match) => new Date(match.scheduledAt) < cutoffDate && match.status === "FINISHED"
  );

  if (matchesToDelete.length > 0) {
    for (const match of matchesToDelete) {
      await db.delete(matchCache).where(eq(matchCache.id, match.id));
    }
  }

  return matchesToDelete.length;
}

export async function updateMatchCache(tournamentApiId: string): Promise<UpdateMatchCacheResult> {
  const result: UpdateMatchCacheResult = {
    updated: 0,
    created: 0,
    deleted: 0,
    errors: [],
    footballDataSuccess: false,
    apiFootballSuccess: false,
    liveMatchesUpdated: 0,
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

    // Clean up old matches first
    result.deleted = await cleanupOldMatches(tournament.id);

    // Phase 1: Fetch schedule from football-data.org
    const footballDataAPI = getFootballDataAPI();
    let matches: Awaited<ReturnType<typeof footballDataAPI.fetchMatchesByCompetition>> = [];
    try {
      matches = await footballDataAPI.fetchMatchesByCompetition(tournamentApiId);
      result.footballDataSuccess = true;
    } catch (error) {
      result.errors.push(
        `Football-data.org API failed: ${error instanceof Error ? error.message : String(error)}`
      );
      result.footballDataSuccess = false;
      // Continue to try API-Football for live matches
      matches = [];
    }

    for (const match of matches) {
      try {
        // Skip matches without teams assigned (TBD matches)
        if (!match.homeTeam?.name || !match.awayTeam?.name) {
          continue;
        }

        const existingMatch = await db
          .select()
          .from(matchCache)
          .where(eq(matchCache.apiMatchId, String(match.id)))
          .limit(1);

        const matchData = {
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
        };

        if (existingMatch.length > 0) {
          await db.update(matchCache).set(matchData).where(eq(matchCache.id, existingMatch[0].id));
          result.updated++;
        } else {
          await db.insert(matchCache).values(matchData);
          result.created++;
        }
      } catch (error) {
        result.errors.push(
          `Failed to cache match ${match.id}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
    // Phase 2: Update live matches from API-Football
    try {
      const apiFootballClient = getAPIFootballClient();
      const liveMatches = await apiFootballClient.fetchLiveMatches(1); // World Cup league ID
      result.apiFootballSuccess = true;

      if (liveMatches.length > 0) {
        const teamMapping = loadTeamMappings();
        result.liveMatchesUpdated = await updateLiveMatches(tournament.id, liveMatches, teamMapping);
      }
    } catch (error) {
      result.errors.push(
        `API-Football failed: ${error instanceof Error ? error.message : String(error)}`
      );
      result.apiFootballSuccess = false;
      // Not a critical failure - we still have football-data.org data
    }
  } catch (error) {
    result.errors.push(
      `Failed to update match cache: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return result;
}

/**
 * Update matches with live data from API-Football
 */
async function updateLiveMatches(
  tournamentId: string,
  liveMatches: APIFootballMatch[],
  teamMapping: Map<number, string>
): Promise<number> {
  let updatedCount = 0;

  for (const match of liveMatches) {
    try {
      // Map API-Football team IDs to football-data.org team IDs
      const homeTeamId = teamMapping.get(match.teams.home.id);
      const awayTeamId = teamMapping.get(match.teams.away.id);

      if (!homeTeamId || !awayTeamId) {
        console.warn(
          `Skipping match ${match.fixture.id}: Team mapping not found (home: ${match.teams.home.id}, away: ${match.teams.away.id})`
        );
        continue;
      }

      // Find existing match by team IDs and approximate date
      // (API-Football doesn't give us football-data match IDs)
      const matchDate = new Date(match.fixture.date);
      const existingMatches = await db
        .select()
        .from(matchCache)
        .where(eq(matchCache.tournamentId, tournamentId));

      const existingMatch = existingMatches.find(
        (m) =>
          m.homeTeamId === homeTeamId &&
          m.awayTeamId === awayTeamId &&
          Math.abs(new Date(m.scheduledAt).getTime() - matchDate.getTime()) < 24 * 60 * 60 * 1000 // Within 24 hours
      );

      if (!existingMatch) {
        console.warn(
          `No existing match found for ${match.teams.home.name} vs ${match.teams.away.name} at ${matchDate}`
        );
        continue;
      }

      // Determine current score (use fulltime if finished, otherwise use current goals)
      let homeScore = match.goals.home;
      let awayScore = match.goals.away;

      // For finished matches, prefer fulltime/extratime scores
      if (match.fixture.status.short === "FT" || match.fixture.status.short === "AET") {
        homeScore = match.score.fulltime.home ?? match.goals.home;
        awayScore = match.score.fulltime.away ?? match.goals.away;
      } else if (match.fixture.status.short === "PEN") {
        // For penalty shootouts, use fulltime (which includes extra time)
        homeScore = match.score.fulltime.home ?? match.goals.home;
        awayScore = match.score.fulltime.away ?? match.goals.away;
      }

      // Merge API-Football data with existing rawData
      const mergedRawData = {
        ...(typeof existingMatch.rawData === 'object' && existingMatch.rawData !== null
          ? existingMatch.rawData
          : {}),
        apiFootball: match, // Store complete API-Football response
      };

      await db
        .update(matchCache)
        .set({
          homeScore,
          awayScore,
          status: mapAPIFootballStatus(match.fixture.status.short),
          stage: match.league.round ?? existingMatch.stage,
          rawData: mergedRawData,
          lastFetchedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(matchCache.id, existingMatch.id));

      updatedCount++;
    } catch (error) {
      console.error(
        `Failed to update live match ${match.fixture.id}:`,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  return updatedCount;
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
