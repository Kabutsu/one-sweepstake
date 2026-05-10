import { router, protectedProcedure } from "../trpc";
import { db } from "@/db";
import { sweepstakes, participants, users, tournaments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

// Generate a unique random join code (6-8 characters, alphanumeric)
function generateJoinCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const length = 6 + Math.floor(Math.random() * 3); // 6-8 characters
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

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

  getActiveTournament: protectedProcedure.query(async () => {
    // For MVP, return the 2026 World Cup tournament
    const tournament = await db
      .select()
      .from(tournaments)
      .where(eq(tournaments.isActive, true))
      .limit(1);

    return tournament[0] || null;
  }),

  getSweepstakeById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const [sweepstake] = await db
        .select({
          id: sweepstakes.id,
          name: sweepstakes.name,
          tournamentId: sweepstakes.tournamentId,
          tournamentName: tournaments.name,
          creatorId: sweepstakes.creatorId,
          joinCode: sweepstakes.joinCode,
          isPrivate: sweepstakes.isPrivate,
          maxParticipants: sweepstakes.maxParticipants,
          currentParticipants: sweepstakes.currentParticipants,
          drawCompletedAt: sweepstakes.drawCompletedAt,
          createdAt: sweepstakes.createdAt,
        })
        .from(sweepstakes)
        .innerJoin(tournaments, eq(sweepstakes.tournamentId, tournaments.id))
        .where(eq(sweepstakes.id, input.id));

      if (!sweepstake) {
        throw new Error("Sweepstake not found");
      }

      // Check if user is a participant
      const [participant] = await db
        .select()
        .from(participants)
        .where(and(eq(participants.sweepstakeId, input.id), eq(participants.userId, ctx.user.id)));

      if (!participant) {
        throw new Error("You are not a participant in this sweepstake");
      }

      // Get all participants with their details
      const allParticipants = await db
        .select({
          id: participants.id,
          userId: participants.userId,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
          joinedAt: participants.joinedAt,
        })
        .from(participants)
        .innerJoin(users, eq(participants.userId, users.id))
        .where(eq(participants.sweepstakeId, input.id));

      return {
        ...sweepstake,
        participants: allParticipants,
        isCreator: sweepstake.creatorId === ctx.user.id,
      };
    }),

  createSweepstake: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required").max(100),
        maxParticipants: z.number().int().min(2).max(48),
        tournamentId: z.string().uuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Generate unique join code
      let joinCode = generateJoinCode();
      let attempts = 0;
      const maxAttempts = 10;

      // Ensure join code is unique
      while (attempts < maxAttempts) {
        const existing = await db
          .select()
          .from(sweepstakes)
          .where(eq(sweepstakes.joinCode, joinCode))
          .limit(1);

        if (existing.length === 0) break;

        joinCode = generateJoinCode();
        attempts++;
      }

      if (attempts >= maxAttempts) {
        throw new Error("Failed to generate unique join code. Please try again.");
      }

      // Create sweepstake
      const [newSweepstake] = await db
        .insert(sweepstakes)
        .values({
          name: input.name,
          tournamentId: input.tournamentId,
          creatorId: ctx.user.id,
          joinCode,
          maxParticipants: input.maxParticipants,
          currentParticipants: 1,
          isPrivate: false,
        })
        .returning();

      // Add creator as first participant
      await db.insert(participants).values({
        sweepstakeId: newSweepstake.id,
        userId: ctx.user.id,
      });

      return newSweepstake;
    }),
});
