import { describe, it, expect } from "vitest";
import {
  executeTeamDraw,
  validateTeamAssignments,
  groupAssignmentsByParticipant,
  type Participant,
} from "../utils/draw-algorithm";
import { type SeedingConfig } from "../scripts/seed-tournament";

describe("Team Draw Algorithm", () => {
  // Mock participants
  const createParticipants = (count: number): Participant[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `participant-${i + 1}`,
      userId: `user-${i + 1}`,
      displayName: `User ${i + 1}`,
    }));
  };

  // Mock teams
  const createTeams = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      id: `team-${i + 1}`,
      name: `Team ${i + 1}`,
      tla: `T${i + 1}`,
      crest: `https://example.com/team-${i + 1}.svg`,
      ranking: i + 1,
    }));
  };

  describe("Basic Team Assignment", () => {
    it("should assign all 48 teams to 12 participants", () => {
      const participants = createParticipants(12);
      const teams = createTeams(48);
      const seedingConfig: SeedingConfig = { teams };

      const assignments = executeTeamDraw(participants, seedingConfig);

      expect(assignments).toHaveLength(48);
      expect(validateTeamAssignments(assignments, 48)).toBe(true);
    });

    it("should give each of 12 participants exactly 4 teams", () => {
      const participants = createParticipants(12);
      const teams = createTeams(48);
      const seedingConfig: SeedingConfig = { teams };

      const assignments = executeTeamDraw(participants, seedingConfig);
      const grouped = groupAssignmentsByParticipant(assignments);

      expect(grouped.size).toBe(12);
      grouped.forEach((participantAssignments) => {
        expect(participantAssignments).toHaveLength(4);
      });
    });

    it("should handle uneven division (13 participants)", () => {
      const participants = createParticipants(13);
      const teams = createTeams(48);
      const seedingConfig: SeedingConfig = { teams };

      const assignments = executeTeamDraw(participants, seedingConfig);
      const grouped = groupAssignmentsByParticipant(assignments);

      expect(assignments).toHaveLength(48);
      expect(grouped.size).toBe(13);

      // Count how many get 4 teams vs 3 teams
      let fourTeamCount = 0;
      let threeTeamCount = 0;

      grouped.forEach((participantAssignments) => {
        if (participantAssignments.length === 4) fourTeamCount++;
        if (participantAssignments.length === 3) threeTeamCount++;
      });

      // 48 / 13 = 3.69 → 10 get 4 teams, 3 get 3 teams
      expect(fourTeamCount).toBe(9); // 48 % 13 = 9
      expect(threeTeamCount).toBe(4); // 13 - 9 = 4
    });

    it("should handle 16 participants (3 teams each)", () => {
      const participants = createParticipants(16);
      const teams = createTeams(48);
      const seedingConfig: SeedingConfig = { teams };

      const assignments = executeTeamDraw(participants, seedingConfig);
      const grouped = groupAssignmentsByParticipant(assignments);

      expect(assignments).toHaveLength(48);
      expect(grouped.size).toBe(16);

      grouped.forEach((participantAssignments) => {
        expect(participantAssignments).toHaveLength(3);
      });
    });
  });

  describe("Team Uniqueness", () => {
    it("should not assign the same team to multiple participants", () => {
      const participants = createParticipants(12);
      const teams = createTeams(48);
      const seedingConfig: SeedingConfig = { teams };

      const assignments = executeTeamDraw(participants, seedingConfig);

      const teamIds = assignments.map((a) => a.teamId);
      const uniqueTeamIds = new Set(teamIds);

      expect(uniqueTeamIds.size).toBe(48);
    });

    it("should assign each team exactly once", () => {
      const participants = createParticipants(12);
      const teams = createTeams(48);
      const seedingConfig: SeedingConfig = { teams };

      const assignments = executeTeamDraw(participants, seedingConfig);

      const teamCounts = new Map<string, number>();
      assignments.forEach((assignment) => {
        const count = teamCounts.get(assignment.teamId) || 0;
        teamCounts.set(assignment.teamId, count + 1);
      });

      teamCounts.forEach((count) => {
        expect(count).toBe(1);
      });
    });
  });

  describe("Participant Fairness", () => {
    it("should assign teams to all participants", () => {
      const participants = createParticipants(12);
      const teams = createTeams(48);
      const seedingConfig: SeedingConfig = { teams };

      const assignments = executeTeamDraw(participants, seedingConfig);
      const grouped = groupAssignmentsByParticipant(assignments);

      const participantIds = participants.map((p) => p.id);
      participantIds.forEach((id) => {
        expect(grouped.has(id)).toBe(true);
      });
    });

    it("should distribute teams relatively evenly", () => {
      const participants = createParticipants(12);
      const teams = createTeams(48);
      const seedingConfig: SeedingConfig = { teams };

      const assignments = executeTeamDraw(participants, seedingConfig);
      const grouped = groupAssignmentsByParticipant(assignments);

      const teamCounts = Array.from(grouped.values()).map((a) => a.length);
      const minTeams = Math.min(...teamCounts);
      const maxTeams = Math.max(...teamCounts);

      // Difference should be at most 1
      expect(maxTeams - minTeams).toBeLessThanOrEqual(1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle 1 participant getting all teams", () => {
      const participants = createParticipants(1);
      const teams = createTeams(48);
      const seedingConfig: SeedingConfig = { teams };

      const assignments = executeTeamDraw(participants, seedingConfig);
      const grouped = groupAssignmentsByParticipant(assignments);

      expect(assignments).toHaveLength(48);
      expect(grouped.size).toBe(1);
      expect(grouped.get(participants[0].id)).toHaveLength(48);
    });

    it("should handle 48 participants (1 team each)", () => {
      const participants = createParticipants(48);
      const teams = createTeams(48);
      const seedingConfig: SeedingConfig = { teams };

      const assignments = executeTeamDraw(participants, seedingConfig);
      const grouped = groupAssignmentsByParticipant(assignments);

      expect(assignments).toHaveLength(48);
      expect(grouped.size).toBe(48);

      grouped.forEach((participantAssignments) => {
        expect(participantAssignments).toHaveLength(1);
      });
    });

    it("should throw error with no participants", () => {
      const participants: Participant[] = [];
      const teams = createTeams(48);
      const seedingConfig: SeedingConfig = { teams };

      expect(() => executeTeamDraw(participants, seedingConfig)).toThrow(
        "No participants to assign teams to"
      );
    });

    it("should throw error with no teams", () => {
      const participants = createParticipants(12);
      const seedingConfig: SeedingConfig = { teams: [] };

      expect(() => executeTeamDraw(participants, seedingConfig)).toThrow(
        "No teams available in seeding configuration"
      );
    });
  });

  describe("Seeding Fairness", () => {
    it("should distribute strength tiers relatively evenly", () => {
      const participants = createParticipants(12);
      const teams = createTeams(48);
      const seedingConfig: SeedingConfig = { teams };

      const assignments = executeTeamDraw(participants, seedingConfig);
      const grouped = groupAssignmentsByParticipant(assignments);

      // Check that each participant gets a mix of rankings
      grouped.forEach((participantAssignments) => {
        const rankings = participantAssignments
          .map((a) => {
            const team = teams.find((t) => t.id === a.teamId);
            return team?.ranking || 0;
          })
          .filter((r) => r > 0);

        if (rankings.length > 0) {
          const avgRanking = rankings.reduce((sum, r) => sum + r, 0) / rankings.length;
          
          // Average ranking should be reasonably close to middle (24.5)
          // Allow generous range since we're using random distribution
          expect(avgRanking).toBeGreaterThan(10);
          expect(avgRanking).toBeLessThan(39);
        }
      });
    });
  });
});
