import { db } from "@/db";
import { matchCache, tournaments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getFootballDataAPI } from "./football-data-api";

export interface UpdateMatchCacheResult {
  updated: number;
  created: number;
  deleted: number;
  errors: string[];
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

    const footballDataAPI = getFootballDataAPI();
    const matches = await footballDataAPI.fetchMatchesByCompetition(tournamentApiId);

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
  } catch (error) {
    result.errors.push(
      `Failed to update match cache: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return result;
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
