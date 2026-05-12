import { describe, it, expect } from "vitest";
import {
  calculateLeaderboard,
  getTeamStandings,
  getTopRankedTeams,
  getAllGroupStandings,
  type LeaderboardSection,
} from "../lib/leaderboard";
import { type Match } from "../lib/elimination-tracker";

describe("Leaderboard", () => {
  describe("calculateLeaderboard", () => {
    it("should split participants into stillIn and eliminated sections", () => {
      const participants = [
        {
          participantId: "1",
          userId: "user1",
          displayName: "Alice",
          avatarUrl: null,
          teams: [
            { teamId: "1", teamName: "Team A", teamLogo: null, isEliminated: false },
            { teamId: "2", teamName: "Team B", teamLogo: null, isEliminated: true },
          ],
        },
        {
          participantId: "2",
          userId: "user2",
          displayName: "Bob",
          avatarUrl: null,
          teams: [
            { teamId: "3", teamName: "Team C", teamLogo: null, isEliminated: true },
            { teamId: "4", teamName: "Team D", teamLogo: null, isEliminated: true },
          ],
        },
      ];

      const leaderboard = calculateLeaderboard(participants);

      expect(leaderboard.stillIn).toHaveLength(1);
      expect(leaderboard.eliminated).toHaveLength(1);
      expect(leaderboard.stillIn[0].displayName).toBe("Alice");
      expect(leaderboard.eliminated[0].displayName).toBe("Bob");
    });

    it("should sort by teams remaining", () => {
      const participants = [
        {
          participantId: "1",
          userId: "user1",
          displayName: "Alice",
          avatarUrl: null,
          teams: [
            { teamId: "1", teamName: "Team A", teamLogo: null, isEliminated: false },
            { teamId: "2", teamName: "Team B", teamLogo: null, isEliminated: true },
          ],
        },
        {
          participantId: "2",
          userId: "user2",
          displayName: "Bob",
          avatarUrl: null,
          teams: [
            { teamId: "3", teamName: "Team C", teamLogo: null, isEliminated: false },
            { teamId: "4", teamName: "Team D", teamLogo: null, isEliminated: false },
            { teamId: "5", teamName: "Team E", teamLogo: null, isEliminated: false },
          ],
        },
      ];

      const leaderboard = calculateLeaderboard(participants);

      expect(leaderboard.stillIn[0].displayName).toBe("Bob"); // 3 teams remaining
      expect(leaderboard.stillIn[1].displayName).toBe("Alice"); // 1 team remaining
      expect(leaderboard.stillIn[0].rank).toBe(1);
      expect(leaderboard.stillIn[1].rank).toBe(2);
    });

    it("should identify winner when only one person remains", () => {
      const participants = [
        {
          participantId: "1",
          userId: "user1",
          displayName: "Alice",
          avatarUrl: null,
          teams: [{ teamId: "1", teamName: "Team A", teamLogo: null, isEliminated: false }],
        },
        {
          participantId: "2",
          userId: "user2",
          displayName: "Bob",
          avatarUrl: null,
          teams: [{ teamId: "2", teamName: "Team B", teamLogo: null, isEliminated: true }],
        },
      ];

      const leaderboard = calculateLeaderboard(participants);

      expect(leaderboard.winner).toBeTruthy();
      expect(leaderboard.winner?.displayName).toBe("Alice");
      expect(leaderboard.runnerUp).toBeTruthy();
      expect(leaderboard.runnerUp?.displayName).toBe("Bob");
    });

    it("should not identify winner when final is ongoing", () => {
      const participants = [
        {
          participantId: "1",
          userId: "user1",
          displayName: "Alice",
          avatarUrl: null,
          teams: [{ teamId: "1", teamName: "Team A", teamLogo: null, isEliminated: false }],
        },
        {
          participantId: "2",
          userId: "user2",
          displayName: "Bob",
          avatarUrl: null,
          teams: [{ teamId: "2", teamName: "Team B", teamLogo: null, isEliminated: false }],
        },
      ];

      const leaderboard = calculateLeaderboard(participants);

      expect(leaderboard.winner).toBeNull();
      expect(leaderboard.runnerUp).toBeNull();
    });

    it("should calculate teams remaining and eliminated correctly", () => {
      const participants = [
        {
          participantId: "1",
          userId: "user1",
          displayName: "Alice",
          avatarUrl: null,
          teams: [
            { teamId: "1", teamName: "Team A", teamLogo: null, isEliminated: false },
            { teamId: "2", teamName: "Team B", teamLogo: null, isEliminated: false },
            { teamId: "3", teamName: "Team C", teamLogo: null, isEliminated: true },
          ],
        },
      ];

      const leaderboard = calculateLeaderboard(participants);

      expect(leaderboard.stillIn[0].teamsRemaining).toBe(2);
      expect(leaderboard.stillIn[0].teamsEliminated).toBe(1);
      expect(leaderboard.stillIn[0].isFullyEliminated).toBe(false);
    });
  });

  describe("getTopRankedTeams", () => {
    it("should return top ranked non-eliminated teams", () => {
      const teamStandings = [
        {
          teamId: "1",
          teamName: "Team A",
          teamLogo: null,
          group: "A",
          position: 1,
          points: 9,
          played: 3,
          won: 3,
          drawn: 0,
          lost: 0,
          goalsFor: 8,
          goalsAgainst: 1,
          goalDifference: 7,
          isEliminated: false,
        },
        {
          teamId: "2",
          teamName: "Team B",
          teamLogo: null,
          group: "B",
          position: 2,
          points: 6,
          played: 3,
          won: 2,
          drawn: 0,
          lost: 1,
          goalsFor: 5,
          goalsAgainst: 3,
          goalDifference: 2,
          isEliminated: false,
        },
        {
          teamId: "3",
          teamName: "Team C",
          teamLogo: null,
          group: "C",
          position: 1,
          points: 7,
          played: 3,
          won: 2,
          drawn: 1,
          lost: 0,
          goalsFor: 6,
          goalsAgainst: 2,
          goalDifference: 4,
          isEliminated: false,
        },
        {
          teamId: "4",
          teamName: "Team D",
          teamLogo: null,
          group: "D",
          position: 4,
          points: 0,
          played: 3,
          won: 0,
          drawn: 0,
          lost: 3,
          goalsFor: 1,
          goalsAgainst: 8,
          goalDifference: -7,
          isEliminated: true,
        },
      ];

      const topTeams = getTopRankedTeams(teamStandings, 2);

      expect(topTeams).toHaveLength(2);
      expect(topTeams[0].teamName).toBe("Team A"); // 1st in group
      expect(topTeams[1].teamName).toBe("Team C"); // 1st in group
    });

    it("should exclude eliminated teams", () => {
      const teamStandings = [
        {
          teamId: "1",
          teamName: "Team A",
          teamLogo: null,
          group: "A",
          position: 1,
          points: 9,
          played: 3,
          won: 3,
          drawn: 0,
          lost: 0,
          goalsFor: 8,
          goalsAgainst: 1,
          goalDifference: 7,
          isEliminated: true, // Eliminated
        },
        {
          teamId: "2",
          teamName: "Team B",
          teamLogo: null,
          group: "B",
          position: 2,
          points: 6,
          played: 3,
          won: 2,
          drawn: 0,
          lost: 1,
          goalsFor: 5,
          goalsAgainst: 3,
          goalDifference: 2,
          isEliminated: false,
        },
      ];

      const topTeams = getTopRankedTeams(teamStandings, 2);

      expect(topTeams).toHaveLength(1);
      expect(topTeams[0].teamName).toBe("Team B");
    });

    it("should sort by position, then points, then goal difference", () => {
      const teamStandings = [
        {
          teamId: "1",
          teamName: "Team A",
          teamLogo: null,
          group: "A",
          position: 2,
          points: 9,
          played: 3,
          won: 3,
          drawn: 0,
          lost: 0,
          goalsFor: 8,
          goalsAgainst: 1,
          goalDifference: 7,
          isEliminated: false,
        },
        {
          teamId: "2",
          teamName: "Team B",
          teamLogo: null,
          group: "B",
          position: 1,
          points: 6,
          played: 3,
          won: 2,
          drawn: 0,
          lost: 1,
          goalsFor: 5,
          goalsAgainst: 3,
          goalDifference: 2,
          isEliminated: false,
        },
      ];

      const topTeams = getTopRankedTeams(teamStandings, 2);

      // Team B should be first despite lower points (position 1 vs 2)
      expect(topTeams[0].teamName).toBe("Team B");
      expect(topTeams[1].teamName).toBe("Team A");
    });
  });

  describe("getAllGroupStandings", () => {
    it("should return group standings from matches", () => {
      const matches: Match[] = [
        {
          apiMatchId: "1",
          homeTeamId: "1",
          homeTeamName: "Team A",
          awayTeamId: "2",
          awayTeamName: "Team B",
          homeScore: 3,
          awayScore: 1,
          status: "FINISHED",
          stage: "GROUP_STAGE",
          rawData: { group: "A" },
        },
        {
          apiMatchId: "2",
          homeTeamId: "3",
          homeTeamName: "Team C",
          awayTeamId: "4",
          awayTeamName: "Team D",
          homeScore: 2,
          awayScore: 2,
          status: "FINISHED",
          stage: "GROUP_STAGE",
          rawData: { group: "B" },
        },
      ];

      const standings = getAllGroupStandings(matches);

      expect(standings.size).toBe(2);
      expect(standings.has("A")).toBe(true);
      expect(standings.has("B")).toBe(true);

      const groupA = standings.get("A");
      expect(groupA).toHaveLength(2);
      expect(groupA![0].teamName).toBe("Team A"); // Won, so first
      expect(groupA![0].points).toBe(3);
    });
  });
});
