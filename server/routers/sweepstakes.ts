import { router, protectedProcedure } from "../trpc";
import { db } from "@/db";
import {
  sweepstakes,
  participants,
  users,
  tournaments,
  teamAssignments,
  matchCache,
  teams,
  teamsTournaments,
} from "@/db/schema";
import { eq, and, lte, gte, count, sql } from "drizzle-orm";
import { z } from "zod";
import { executeTeamDraw, executeUnbalancedDraw } from "@/utils/draw-algorithm";
import { getTournamentSeeding } from "@/scripts/seed-tournament";
import { Match, calculateGroupStandings } from "@/lib/elimination-tracker";
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
        drawCompletedAt: sweepstakes.drawCompletedAt,
        creatorId: sweepstakes.creatorId,
        joinCode: sweepstakes.joinCode,
        createdAt: sweepstakes.createdAt,
      })
      .from(participants)
      .innerJoin(sweepstakes, eq(participants.sweepstakeId, sweepstakes.id))
      .innerJoin(tournaments, eq(sweepstakes.tournamentId, tournaments.id))
      .where(eq(participants.userId, ctx.user.id));

    // Get participant counts for each sweepstake
    const sweepstakeIds = userSweepstakes.map((s) => s.id);
    const participantCounts = await db
      .select({
        sweepstakeId: participants.sweepstakeId,
        count: count(),
      })
      .from(participants)
      .where(sql`${participants.sweepstakeId} IN ${sweepstakeIds}`)
      .groupBy(participants.sweepstakeId);

    const countMap = new Map(participantCounts.map((pc) => [pc.sweepstakeId, Number(pc.count)]));

    return userSweepstakes.map((s) => ({
      ...s,
      currentParticipants: countMap.get(s.id) || 0,
    }));
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

      // Get total teams count for this tournament
      const teamCount = await db
        .select({ count: count() })
        .from(teamsTournaments)
        .where(eq(teamsTournaments.tournamentId, sweepstake.tournamentId));

      return {
        ...sweepstake,
        currentParticipants: allParticipants.length,
        tournamentActive,
        participants: allParticipants,
        isCreator: sweepstake.creatorId === ctx.user.id,
        totalTeams: Number(teamCount[0]?.count || 0),
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
        throw new Error(
          "Unable to generate a unique join code at this time. Please try creating the sweepstake again."
        );
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
        throw new Error(
          "Invalid join code. Please check the code and try again, or contact the sweepstake creator for the correct code."
        );
      }

      // Check if draw has been completed
      if (sweepstake.drawCompletedAt) {
        throw new Error(
          "This sweepstake has already completed its draw and is now closed to new participants."
        );
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
        throw new Error(
          "You are already a participant in this sweepstake. Check your dashboard to view it."
        );
      }

      // Check if sweepstake is full
      const participantCount = await db
        .select({ count: count() })
        .from(participants)
        .where(eq(participants.sweepstakeId, sweepstake.id));

      const currentCount = Number(participantCount[0]?.count || 0);
      if (currentCount >= sweepstake.maxParticipants) {
        throw new Error(
          "This sweepstake is full and cannot accept more participants. Please ask the creator to start a new one."
        );
      }

      try {
        // Add user as participant
        await db.insert(participants).values({
          sweepstakeId: sweepstake.id,
          userId: ctx.user.id,
        });

        return { sweepstakeId: sweepstake.id };
      } catch (error: any) {
        // Handle database constraint violations
        if (error.code === "23505") {
          // Unique constraint violation
          throw new Error(
            "You are already a participant in this sweepstake. Check your dashboard to view it."
          );
        }
        throw error;
      }
    }),

  executeDraw: protectedProcedure
    .input(
      z.object({
        sweepstakeId: z.string().uuid(),
        drawType: z.enum(["balanced", "unbalanced"]).default("balanced"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Get sweepstake with tournament
      const [sweepstake] = await db
        .select()
        .from(sweepstakes)
        .where(eq(sweepstakes.id, input.sweepstakeId))
        .limit(1);

      if (!sweepstake) {
        throw new Error("Sweepstake not found. It may have been deleted.");
      }

      // Check if user is the creator
      if (sweepstake.creatorId !== ctx.user.id) {
        throw new Error(
          "Only the sweepstake creator can execute the draw. Please ask the creator to perform this action."
        );
      }

      // Check if draw has already been completed
      if (sweepstake.drawCompletedAt) {
        throw new Error(
          "The draw has already been completed for this sweepstake. Teams have been assigned."
        );
      }

      // Get tournament
      const [tournament] = await db
        .select()
        .from(tournaments)
        .where(eq(tournaments.id, sweepstake.tournamentId))
        .limit(1);

      if (!tournament) {
        throw new Error("Tournament not found");
      }

      // Get tournament seeding configuration
      const seedingConfig = await getTournamentSeeding(tournament.id);

      if (!seedingConfig || !seedingConfig.teams || seedingConfig.teams.length === 0) {
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

      if (sweepstakeParticipants.length < 2) {
        throw new Error(
          "At least 2 participants are required to perform the draw. Please invite more participants before drawing teams."
        );
      }

      // Execute the draw algorithm based on draw type
      const assignments =
        input.drawType === "unbalanced"
          ? executeUnbalancedDraw(sweepstakeParticipants, seedingConfig)
          : executeTeamDraw(sweepstakeParticipants, seedingConfig);

      // Insert team assignments into database
      await db.insert(teamAssignments).values(
        assignments.map((assignment) => ({
          participantId: assignment.participantId,
          teamId: assignment.teamId,
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

      // Get all team assignments for this sweepstake with elimination status
      const assignments = await db
        .select({
          id: teamAssignments.id,
          participantId: teamAssignments.participantId,
          teamId: teamAssignments.teamId,
          teamName: teams.name,
          teamLogo: teams.crest,
          assignedAt: teamAssignments.assignedAt,
          userId: participants.userId,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
          isEliminated: teamsTournaments.isEliminated,
        })
        .from(teamAssignments)
        .innerJoin(participants, eq(teamAssignments.participantId, participants.id))
        .innerJoin(users, eq(participants.userId, users.id))
        .innerJoin(teams, eq(teamAssignments.teamId, teams.id))
        .innerJoin(teamsTournaments, eq(teams.id, teamsTournaments.teamId))
        .where(
          and(
            eq(participants.sweepstakeId, input.sweepstakeId),
            eq(teamsTournaments.tournamentId, sweepstake.tournamentId)
          )
        );

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
            isEliminated: assignment.isEliminated,
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

      // Get all matches for group standings calculation
      const matchRecords = await db
        .select()
        .from(matchCache)
        .where(eq(matchCache.tournamentId, sweepstake.tournamentId));

      // Get all teams to enrich match data
      const teamRecords = await db.select().from(teams);
      const teamsMap = new Map(teamRecords.map((t) => [t.id, t]));

      // Enrich matches with team names
      const matches = matchRecords.map((match) => ({
        ...match,
        homeTeamName: teamsMap.get(match.homeTeamId)?.name || match.homeTeamId,
        awayTeamName: teamsMap.get(match.awayTeamId)?.name || match.awayTeamId,
      })) as Match[];

      // Calculate group standings to get team performance stats
      const groupStandings = calculateGroupStandings(matches);
      const teamPerformanceMap = new Map<
        string,
        { points: number; goalDifference: number; goalsFor: number }
      >();

      for (const [_, standings] of groupStandings) {
        for (const standing of standings) {
          teamPerformanceMap.set(standing.teamId, {
            points: standing.points,
            goalDifference: standing.goalDifference,
            goalsFor: standing.goalsFor,
          });
        }
      }

      // Get all team assignments with elimination status from database
      const assignments = await db
        .select({
          id: teamAssignments.id,
          participantId: teamAssignments.participantId,
          teamId: teamAssignments.teamId,
          teamName: teams.name,
          teamLogo: teams.crest,
          teamRaking: teamsTournaments.ranking,
          isEliminated: teamsTournaments.isEliminated,
          userId: participants.userId,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        })
        .from(teamAssignments)
        .innerJoin(participants, eq(teamAssignments.participantId, participants.id))
        .innerJoin(users, eq(participants.userId, users.id))
        .innerJoin(teams, eq(teamAssignments.teamId, teams.id))
        .innerJoin(teamsTournaments, eq(teams.id, teamsTournaments.teamId))
        .where(
          and(
            eq(participants.sweepstakeId, input.sweepstakeId),
            eq(teamsTournaments.tournamentId, sweepstake.tournamentId)
          )
        );

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
          const performance = teamPerformanceMap.get(assignment.teamId);
          acc[assignment.participantId].teams.push({
            teamId: assignment.teamId,
            teamName: assignment.teamName,
            teamLogo: assignment.teamLogo,
            teamRanking: assignment.teamRaking,
            isEliminated: assignment.isEliminated,
            points: performance?.points ?? 0,
            goalDifference: performance?.goalDifference ?? 0,
            goalsFor: performance?.goalsFor ?? 0,
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
        awayTeamName: teamsMap.get(match.awayTeamId)?.name || match.awayTeamId,
      })) as Match[];

      const groupStandings = getAllGroupStandings(matches);

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
        drawCompletedAt: sweepstakes.drawCompletedAt,
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
      (s) =>
        s.tournamentEndDate && new Date(s.tournamentEndDate) > now && s.drawCompletedAt !== null
    );

    if (activeSweepstakes.length === 0) {
      return {
        teamsRemaining: [],
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
        // Get all teams to enrich match data
        const teamRecords = await db.select().from(teams);
        const teamsMap = new Map(teamRecords.map((t) => [t.id, t]));

        // Enrich matches with team names
        allMatches = matches.map((match) => ({
          ...match,
          homeTeamName: teamsMap.get(match.homeTeamId)?.name || match.homeTeamId,
          awayTeamName: teamsMap.get(match.awayTeamId)?.name || match.awayTeamId,
        })) as Match[];
      }

      // Get team assignments with elimination status from database
      const assignments = await db
        .select({
          teamId: teamAssignments.teamId,
          teamName: teams.name,
          teamLogo: teams.crest,
          isEliminated: teamsTournaments.isEliminated,
        })
        .from(teamAssignments)
        .innerJoin(teams, eq(teamAssignments.teamId, teams.id))
        .innerJoin(teamsTournaments, eq(teams.id, teamsTournaments.teamId))
        .where(
          and(
            eq(teamAssignments.participantId, sweepstake.participantId),
            eq(teamsTournaments.tournamentId, sweepstake.tournamentId)
          )
        );

      allUserTeams = [...allUserTeams, ...assignments];
    }

    // Remove duplicates
    const uniqueTeams = Array.from(new Map(allUserTeams.map((t) => [t.teamId, t])).values());

    const teamsRemaining = uniqueTeams.filter((t) => !t.isEliminated);
    const teamStandings = getTeamStandings(allMatches, uniqueTeams);
    const topTeams = getTopRankedTeams(teamStandings, 3);

    return {
      teamsRemaining,
      totalTeamsRemaining: teamsRemaining.length,
      topTeams,
      activeSweepstakes: activeSweepstakes.length,
    };
  }),
});
