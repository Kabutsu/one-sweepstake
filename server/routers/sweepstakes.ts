import { router, protectedProcedure } from "../trpc";
import { db } from "@/db";
import { sweepstakes, participants, users, tournaments } from "@/db/schema";
import { eq } from "drizzle-orm";

export const sweepstakesRouter = router({
  getUserSweepstakes: protectedProcedure.query(async ({ ctx }) => {
    const userSweepstakes = await db
      .select({
        id: sweepstakes.id,
        name: sweepstakes.name,
        tournamentName: tournaments.name,
        maxParticipants: sweepstakes.maxParticipants,
        currentParticipants: sweepstakes.currentParticipants,
        drawCompletedAt: sweepstakes.drawCompletedAt,
        creatorId: sweepstakes.creatorId,
        joinCode: sweepstakes.joinCode,
        createdAt: sweepstakes.createdAt,
      })
      .from(participants)
      .innerJoin(sweepstakes, eq(participants.sweepstakeId, sweepstakes.id))
      .innerJoin(tournaments, eq(sweepstakes.tournamentId, tournaments.id))
      .where(eq(participants.userId, ctx.user.id));

    return userSweepstakes;
  }),
});
