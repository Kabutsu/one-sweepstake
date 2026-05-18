import { router, protectedProcedure } from "../trpc";
import { db } from "@/db";
import { matchCache, teams } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

export const matchesRouter = router({
  getMatchesByTournament: protectedProcedure
    .input(z.object({ tournamentId: z.string().uuid() }))
    .query(async ({ input }) => {
      const matchRecords = await db
        .select()
        .from(matchCache)
        .where(eq(matchCache.tournamentId, input.tournamentId))
        .orderBy(desc(matchCache.scheduledAt));

      // Get all teams to enrich match data
      const teamRecords = await db.select().from(teams);
      const teamsMap = new Map(teamRecords.map((t) => [t.id, t]));

      // Enrich matches with team names
      const matches = matchRecords.map((match) => ({
        ...match,
        homeTeamName: teamsMap.get(match.homeTeamId)?.name || match.homeTeamId,
        homeTeamCrest: teamsMap.get(match.homeTeamId)?.crest || null,
        awayTeamName: teamsMap.get(match.awayTeamId)?.name || match.awayTeamId,
        awayTeamCrest: teamsMap.get(match.awayTeamId)?.crest || null,
      }));

      return {
        matches,
        lastUpdated: matches.length > 0 ? matches[0].lastFetchedAt : null,
      };
    }),

  getMatchById: protectedProcedure
    .input(z.object({ matchId: z.string() }))
    .query(async ({ input }) => {
      const [matchRecord] = await db
        .select()
        .from(matchCache)
        .where(eq(matchCache.apiMatchId, input.matchId))
        .limit(1);

      if (!matchRecord) {
        throw new Error("Match not found");
      }

      // Get teams to enrich match data
      const homeTeam = await db
        .select()
        .from(teams)
        .where(eq(teams.id, matchRecord.homeTeamId))
        .limit(1);
      const awayTeam = await db
        .select()
        .from(teams)
        .where(eq(teams.id, matchRecord.awayTeamId))
        .limit(1);

      return {
        ...matchRecord,
        homeTeamName: homeTeam[0]?.name || matchRecord.homeTeamId,
        homeTeamCrest: homeTeam[0]?.crest || null,
        awayTeamName: awayTeam[0]?.name || matchRecord.awayTeamId,
        awayTeamCrest: awayTeam[0]?.crest || null,
      };
    }),

  getLiveMatches: protectedProcedure
    .input(z.object({ tournamentId: z.string().uuid() }))
    .query(async ({ input }) => {
      const matchRecords = await db
        .select()
        .from(matchCache)
        .where(eq(matchCache.tournamentId, input.tournamentId));

      // Get all teams to enrich match data
      const teamRecords = await db.select().from(teams);
      const teamsMap = new Map(teamRecords.map((t) => [t.id, t]));

      // Enrich matches with team names
      const matches = matchRecords.map((match) => ({
        ...match,
        homeTeamName: teamsMap.get(match.homeTeamId)?.name || match.homeTeamId,
        homeTeamCrest: teamsMap.get(match.homeTeamId)?.crest || null,
        awayTeamName: teamsMap.get(match.awayTeamId)?.name || match.awayTeamId,
        awayTeamCrest: teamsMap.get(match.awayTeamId)?.crest || null,
      }));

      const liveMatches = matches
        .filter((match) => match.status === "IN_PLAY" || match.status === "PAUSED")
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

      const upcomingMatches = matches
        .filter((match) => ["SCHEDULED", "TIMED"].includes(match.status))
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

      const finishedMatches = matches
        .filter((match) => match.status === "FINISHED")
        .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

      // Prioritize: live first, then fill with upcoming to reach minimum 2 matches
      const displayMatches = [...liveMatches];
      const needed = Math.max(0, 2 - displayMatches.length);
      displayMatches.push(...upcomingMatches.slice(0, needed));

      return {
        display: displayMatches,
        live: liveMatches,
        upcoming: upcomingMatches.slice(0, 5),
        finished: finishedMatches.slice(0, 10),
        lastUpdated: matches.length > 0 ? matches[0].lastFetchedAt : null,
      };
    }),
});
