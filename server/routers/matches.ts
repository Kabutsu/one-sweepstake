import { router, protectedProcedure } from "../trpc";
import { db } from "@/db";
import { matchCache } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

export const matchesRouter = router({
  getMatchesByTournament: protectedProcedure
    .input(z.object({ tournamentId: z.string().uuid() }))
    .query(async ({ input }) => {
      const matches = await db
        .select()
        .from(matchCache)
        .where(eq(matchCache.tournamentId, input.tournamentId))
        .orderBy(desc(matchCache.scheduledAt));

      return {
        matches,
        lastUpdated: matches.length > 0 ? matches[0].lastFetchedAt : null,
      };
    }),

  getMatchById: protectedProcedure
    .input(z.object({ matchId: z.string() }))
    .query(async ({ input }) => {
      const [match] = await db
        .select()
        .from(matchCache)
        .where(eq(matchCache.apiMatchId, input.matchId))
        .limit(1);

      if (!match) {
        throw new Error("Match not found");
      }

      return match;
    }),

  getLiveMatches: protectedProcedure
    .input(z.object({ tournamentId: z.string().uuid() }))
    .query(async ({ input }) => {
      const matches = await db
        .select()
        .from(matchCache)
        .where(eq(matchCache.tournamentId, input.tournamentId));

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
