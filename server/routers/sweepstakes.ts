import { router, protectedProcedure } from "../trpc";
import { db } from "@/db";
import {
  sweepstakes,
  participants,
  users,
  tournaments,
  teamAssignments,
  matchCache,
} from "@/db/schema";
import { eq, and, lte, gte } from "drizzle-orm";
import { z } from "zod";
import { executeTeamDraw } from "@/utils/draw-algorithm";
import { SeedingConfig } from "@/scripts/seed-tournament";
import { getEliminationStatus, Match } from "@/lib/elimination-tracker";
import {
  calculateLeaderboard,
  getAllGroupStandings,
  getTeamStandings,
  getTopRankedTeams,
} from "@/lib/leaderboard";

const WC_CODE = "fifa-world-cup";

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
      .where(eq(tournaments.slug, WC_CODE))
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
          tournamentStartDate: tournaments.startDate,
          tournamentEndDate: tournaments.endDate,
          tournamentIsActive: tournaments.isActive,
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

      // Compute tournament active state based on dates and isActive flag
      const now = new Date();
      const tournamentHasStarted = sweepstake.tournamentStartDate <= now;
      const tournamentActive = sweepstake.tournamentIsActive || tournamentHasStarted;

      return {
        ...sweepstake,
        tournamentActive,
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

  joinSweepstake: protectedProcedure
    .input(
      z.object({
        joinCode: z.string().min(1, "Join code is required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const normalizedCode = input.joinCode.trim().toUpperCase();

      // Find sweepstake by join code
      const [sweepstake] = await db
        .select()
        .from(sweepstakes)
        .where(eq(sweepstakes.joinCode, normalizedCode))
        .limit(1);

      if (!sweepstake) {
        throw new Error("Invalid join code. Please check the code and try again.");
      }

      // Check if draw has been completed
      if (sweepstake.drawCompletedAt) {
        throw new Error(
          "This sweepstake has already been drawn and cannot accept new participants."
        );
      }

      // Check if sweepstake is full
      if (sweepstake.currentParticipants >= sweepstake.maxParticipants) {
        throw new Error("This sweepstake is full and cannot accept more participants.");
      }

      // Check if user is already a participant
      const [existingParticipant] = await db
        .select()
        .from(participants)
        .where(
          and(eq(participants.sweepstakeId, sweepstake.id), eq(participants.userId, ctx.user.id))
        )
        .limit(1);

      if (existingParticipant) {
        throw new Error("You are already a participant in this sweepstake.");
      }

      // Add user as participant
      await db.insert(participants).values({
        sweepstakeId: sweepstake.id,
        userId: ctx.user.id,
      });

      // Increment current participant count
      await db
        .update(sweepstakes)
        .set({
          currentParticipants: sweepstake.currentParticipants + 1,
        })
        .where(eq(sweepstakes.id, sweepstake.id));

      return { sweepstakeId: sweepstake.id };
    }),

  executeDraw: protectedProcedure
    .input(z.object({ sweepstakeId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      // Get sweepstake with tournament
      const [sweepstake] = await db
        .select()
        .from(sweepstakes)
        .where(eq(sweepstakes.id, input.sweepstakeId))
        .limit(1);

      if (!sweepstake) {
        throw new Error("Sweepstake not found");
      }

      // Check if user is the creator
      if (sweepstake.creatorId !== ctx.user.id) {
        throw new Error("Only the sweepstake creator can execute the draw");
      }

      // Check if draw has already been completed
      if (sweepstake.drawCompletedAt) {
        throw new Error("Draw has already been completed for this sweepstake");
      }

      // Get tournament with seeding config
      const [tournament] = await db
        .select()
        .from(tournaments)
        .where(eq(tournaments.id, sweepstake.tournamentId))
        .limit(1);

      if (!tournament) {
        throw new Error("Tournament not found");
      }

      if (!tournament.seedingConfig) {
        throw new Error("Tournament seeding configuration not found");
      }

      // Get all participants with user details
      const sweepstakeParticipants = await db
        .select({
          id: participants.id,
          userId: participants.userId,
          displayName: users.displayName,
        })
        .from(participants)
        .innerJoin(users, eq(participants.userId, users.id))
        .where(eq(participants.sweepstakeId, input.sweepstakeId));

      if (sweepstakeParticipants.length === 0) {
        throw new Error("No participants found for this sweepstake");
      }

      // Execute the draw algorithm
      const seedingConfig = tournament.seedingConfig as SeedingConfig;
      const assignments = executeTeamDraw(sweepstakeParticipants, seedingConfig);

      // Insert team assignments into database
      await db.insert(teamAssignments).values(
        assignments.map((assignment) => ({
          participantId: assignment.participantId,
          teamId: assignment.teamId,
          teamName: assignment.teamName,
          teamLogo: assignment.teamLogo,
        }))
      );

      // Mark draw as completed
      await db
        .update(sweepstakes)
        .set({
          drawCompletedAt: new Date(),
        })
        .where(eq(sweepstakes.id, input.sweepstakeId));

      return {
        success: true,
        assignedTeams: assignments.length,
      };
    }),

  getTeamAssignments: protectedProcedure
    .input(z.object({ sweepstakeId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      // Verify user is a participant
      const [participant] = await db
        .select()
        .from(participants)
        .where(
          and(
            eq(participants.sweepstakeId, input.sweepstakeId),
            eq(participants.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!participant) {
        throw new Error("You are not a participant in this sweepstake");
      }

      // Get sweepstake with tournament info
      const [sweepstake] = await db
        .select({
          tournamentId: sweepstakes.tournamentId,
        })
        .from(sweepstakes)
        .where(eq(sweepstakes.id, input.sweepstakeId))
        .limit(1);

      if (!sweepstake) {
        throw new Error("Sweepstake not found");
      }

      // Get all matches for the tournament to calculate elimination status
      const matches = await db
        .select()
        .from(matchCache)
        .where(eq(matchCache.tournamentId, sweepstake.tournamentId));

      // Calculate elimination status for all teams
      const eliminationStatus = getEliminationStatus(matches as Match[]);

      // Get all team assignments for this sweepstake
      const assignments = await db
        .select({
          id: teamAssignments.id,
          participantId: teamAssignments.participantId,
          teamId: teamAssignments.teamId,
          teamName: teamAssignments.teamName,
          teamLogo: teamAssignments.teamLogo,
          assignedAt: teamAssignments.assignedAt,
          userId: participants.userId,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        })
        .from(teamAssignments)
        .innerJoin(participants, eq(teamAssignments.participantId, participants.id))
        .innerJoin(users, eq(participants.userId, users.id))
        .where(eq(participants.sweepstakeId, input.sweepstakeId));

      // Group by participant and include elimination status
      const grouped = assignments.reduce(
        (acc, assignment) => {
          if (!acc[assignment.participantId]) {
            acc[assignment.participantId] = {
              participantId: assignment.participantId,
              userId: assignment.userId,
              displayName: assignment.displayName,
              avatarUrl: assignment.avatarUrl,
              teams: [],
            };
          }
          acc[assignment.participantId].teams.push({
            id: assignment.id,
            teamId: assignment.teamId,
            teamName: assignment.teamName,
            teamLogo: assignment.teamLogo,
            assignedAt: assignment.assignedAt,
            isEliminated: eliminationStatus.get(assignment.teamId) || false,
          });
          return acc;
        },
        {} as Record<string, any>
      );

      return Object.values(grouped);
    }),

  getLeaderboard: protectedProcedure
    .input(z.object({ sweepstakeId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      // Verify user is a participant
      const [participant] = await db
        .select()
        .from(participants)
        .where(
          and(
            eq(participants.sweepstakeId, input.sweepstakeId),
            eq(participants.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!participant) {
        throw new Error("You are not a participant in this sweepstake");
      }

      // Get sweepstake with tournament info
      const [sweepstake] = await db
        .select({
          tournamentId: sweepstakes.tournamentId,
        })
        .from(sweepstakes)
        .where(eq(sweepstakes.id, input.sweepstakeId))
        .limit(1);

      if (!sweepstake) {
        throw new Error("Sweepstake not found");
      }

      // Get all matches for elimination calculation
      const matches = await db
        .select()
        .from(matchCache)
        .where(eq(matchCache.tournamentId, sweepstake.tournamentId));

      const eliminationStatus = getEliminationStatus(matches as Match[]);

      // Get all team assignments
      const assignments = await db
        .select({
          id: teamAssignments.id,
          participantId: teamAssignments.participantId,
          teamId: teamAssignments.teamId,
          teamName: teamAssignments.teamName,
          teamLogo: teamAssignments.teamLogo,
          userId: participants.userId,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        })
        .from(teamAssignments)
        .innerJoin(participants, eq(teamAssignments.participantId, participants.id))
        .innerJoin(users, eq(participants.userId, users.id))
        .where(eq(participants.sweepstakeId, input.sweepstakeId));

      // Group by participant
      const grouped = assignments.reduce(
        (acc, assignment) => {
          if (!acc[assignment.participantId]) {
            acc[assignment.participantId] = {
              participantId: assignment.participantId,
              userId: assignment.userId,
              displayName: assignment.displayName,
              avatarUrl: assignment.avatarUrl,
              teams: [],
            };
          }
          acc[assignment.participantId].teams.push({
            teamId: assignment.teamId,
            teamName: assignment.teamName,
            teamLogo: assignment.teamLogo,
            isEliminated: eliminationStatus.get(assignment.teamId) || false,
          });
          return acc;
        },
        {} as Record<string, any>
      );

      const participantsData = Object.values(grouped);
      const leaderboard = calculateLeaderboard(participantsData);

      return leaderboard;
    }),

  getGroupStandings: protectedProcedure
    .input(z.object({ tournamentId: z.string().uuid() }))
    .query(async ({ input }) => {
      // Get all matches for the tournament
      const matches = await db
        .select()
        .from(matchCache)
        .where(eq(matchCache.tournamentId, input.tournamentId));

      const groupStandings = getAllGroupStandings(matches as Match[]);

      // Convert Map to object for JSON serialization
      const standingsObject: Record<string, any[]> = {};
      for (const [group, standings] of groupStandings) {
        standingsObject[group] = standings;
      }

      return standingsObject;
    }),

  getDashboardSummary: protectedProcedure.query(async ({ ctx }) => {
    // Get user's sweepstakes that have been drawn
    const userSweepstakes = await db
      .select({
        sweepstakeId: sweepstakes.id,
        tournamentId: sweepstakes.tournamentId,
        tournamentEndDate: tournaments.endDate,
        participantId: participants.id,
      })
      .from(participants)
      .innerJoin(sweepstakes, eq(participants.sweepstakeId, sweepstakes.id))
      .innerJoin(tournaments, eq(sweepstakes.tournamentId, tournaments.id))
      .where(eq(participants.userId, ctx.user.id));

    // Filter to active sweepstakes (drawn and tournament hasn't ended)
    const now = new Date();
    const activeSweepstakes = userSweepstakes.filter(
      (s) => s.tournamentEndDate && new Date(s.tournamentEndDate) > now
    );

    if (activeSweepstakes.length === 0) {
      return {
        totalTeamsRemaining: 0,
        topTeams: [],
        activeSweepstakes: 0,
      };
    }

    // Get all team assignments for active sweepstakes
    let allUserTeams: any[] = [];
    let allMatches: Match[] = [];

    for (const sweepstake of activeSweepstakes) {
      const matches = await db
        .select()
        .from(matchCache)
        .where(eq(matchCache.tournamentId, sweepstake.tournamentId));

      if (allMatches.length === 0) {
        allMatches = matches as Match[];
      }

      const eliminationStatus = getEliminationStatus(matches as Match[]);

      const assignments = await db
        .select({
          teamId: teamAssignments.teamId,
          teamName: teamAssignments.teamName,
          teamLogo: teamAssignments.teamLogo,
        })
        .from(teamAssignments)
        .where(eq(teamAssignments.participantId, sweepstake.participantId));

      const teamsWithStatus = assignments.map((a) => ({
        ...a,
        isEliminated: eliminationStatus.get(a.teamId) || false,
      }));

      allUserTeams = [...allUserTeams, ...teamsWithStatus];
    }

    // Remove duplicates
    const uniqueTeams = Array.from(new Map(allUserTeams.map((t) => [t.teamId, t])).values());

    const teamsRemaining = uniqueTeams.filter((t) => !t.isEliminated).length;
    const teamStandings = getTeamStandings(allMatches, uniqueTeams);
    const topTeams = getTopRankedTeams(teamStandings, 3);

    return {
      totalTeamsRemaining: teamsRemaining,
      topTeams,
      activeSweepstakes: activeSweepstakes.length,
    };
  }),
});
