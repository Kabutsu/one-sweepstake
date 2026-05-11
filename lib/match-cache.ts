import { db } from "@/db";
import { matchCache, tournaments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getFootballDataAPI } from "./football-data-api";

export interface UpdateMatchCacheResult {
  updated: number;
  created: number;
  errors: string[];
}

export async function updateMatchCache(tournamentApiId: string): Promise<UpdateMatchCacheResult> {
  const result: UpdateMatchCacheResult = {
    updated: 0,
    created: 0,
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

    const footballDataAPI = getFootballDataAPI();
    const matches = await footballDataAPI.fetchMatchesByCompetition(tournamentApiId);

    for (const match of matches) {
      try {
        const existingMatch = await db
          .select()
          .from(matchCache)
          .where(eq(matchCache.apiMatchId, String(match.id)))
          .limit(1);

        const matchData = {
          tournamentId: tournament.id,
          apiMatchId: String(match.id),
          homeTeamId: String(match.homeTeam.id),
          homeTeamName: match.homeTeam.name,
          awayTeamId: String(match.awayTeam.id),
          awayTeamName: match.awayTeam.name,
          homeScore: match.score.fullTime.home,
          awayScore: match.score.fullTime.away,
          status: match.status,
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

  return now >= startDate && now <= endDate;
}
