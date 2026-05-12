import { describe, it, expect } from "vitest";
import {
  calculateGroupStandings,
  rankThirdPlaceTeams,
  isTeamEliminated,
  getEliminationStatus,
  type Match,
  type GroupStanding,
} from "../lib/elimination-tracker";

describe("Elimination Tracker", () => {
  // Helper to create mock matches
  const createMatch = (
    id: string,
    homeTeam: { id: string; name: string },
    awayTeam: { id: string; name: string },
    homeScore: number | null,
    awayScore: number | null,
    status: string,
    group?: string,
    stage?: string
  ): Match => ({
    apiMatchId: id,
    homeTeamId: homeTeam.id,
    homeTeamName: homeTeam.name,
    awayTeamId: awayTeam.id,
    awayTeamName: awayTeam.name,
    homeScore,
    awayScore,
    status,
    stage: stage || "GROUP_STAGE",
    rawData: group ? { group } : {},
  });

  describe("calculateGroupStandings", () => {
    it("should calculate standings for a complete group", () => {
      const matches: Match[] = [
        createMatch(
          "1",
          { id: "1", name: "Team A" },
          { id: "2", name: "Team B" },
          3,
          1,
          "FINISHED",
          "A"
        ),
        createMatch(
          "2",
          { id: "3", name: "Team C" },
          { id: "4", name: "Team D" },
          2,
          2,
          "FINISHED",
          "A"
        ),
        createMatch(
          "3",
          { id: "1", name: "Team A" },
          { id: "3", name: "Team C" },
          1,
          0,
          "FINISHED",
          "A"
        ),
        createMatch(
          "4",
          { id: "2", name: "Team B" },
          { id: "4", name: "Team D" },
          1,
          1,
          "FINISHED",
          "A"
        ),
        createMatch(
          "5",
          { id: "1", name: "Team A" },
          { id: "4", name: "Team D" },
          2,
          0,
          "FINISHED",
          "A"
        ),
        createMatch(
          "6",
          { id: "2", name: "Team B" },
          { id: "3", name: "Team C" },
          0,
          1,
          "FINISHED",
          "A"
        ),
      ];

      const standings = calculateGroupStandings(matches);
      const groupA = standings.get("A");

      expect(groupA).toBeDefined();
      expect(groupA!).toHaveLength(4);

      // Team A should be first (3 wins, 9 points)
      expect(groupA![0].teamName).toBe("Team A");
      expect(groupA![0].points).toBe(9);
      expect(groupA![0].won).toBe(3);
    });

    it("should handle draws correctly", () => {
      const matches: Match[] = [
        createMatch(
          "1",
          { id: "1", name: "Team A" },
          { id: "2", name: "Team B" },
          1,
          1,
          "FINISHED",
          "A"
        ),
      ];

      const standings = calculateGroupStandings(matches);
      const groupA = standings.get("A");

      expect(groupA![0].points).toBe(1);
      expect(groupA![0].drawn).toBe(1);
      expect(groupA![1].points).toBe(1);
      expect(groupA![1].drawn).toBe(1);
    });

    it("should calculate goal difference correctly", () => {
      const matches: Match[] = [
        createMatch(
          "1",
          { id: "1", name: "Team A" },
          { id: "2", name: "Team B" },
          5,
          0,
          "FINISHED",
          "A"
        ),
        createMatch(
          "2",
          { id: "1", name: "Team A" },
          { id: "3", name: "Team C" },
          3,
          1,
          "FINISHED",
          "A"
        ),
      ];

      const standings = calculateGroupStandings(matches);
      const groupA = standings.get("A");
      const teamA = groupA!.find((s) => s.teamName === "Team A");

      expect(teamA!.goalsFor).toBe(8);
      expect(teamA!.goalsAgainst).toBe(1);
      expect(teamA!.goalDifference).toBe(7);
    });

    it("should sort by points, then goal difference, then goals scored", () => {
      const matches: Match[] = [
        // Team A: 1 win (3 pts, +1 GD, 2 GF)
        createMatch(
          "1",
          { id: "1", name: "Team A" },
          { id: "2", name: "Team B" },
          2,
          1,
          "FINISHED",
          "A"
        ),
        // Team C: 1 win (3 pts, +2 GD, 3 GF) - should rank higher than A
        createMatch(
          "2",
          { id: "3", name: "Team C" },
          { id: "4", name: "Team D" },
          3,
          1,
          "FINISHED",
          "A"
        ),
      ];

      const standings = calculateGroupStandings(matches);
      const groupA = standings.get("A");

      // Team C should rank first (same points but better GD)
      expect(groupA![0].teamName).toBe("Team C");
      expect(groupA![1].teamName).toBe("Team A");
    });

    it("should only process finished group matches", () => {
      const matches: Match[] = [
        createMatch(
          "1",
          { id: "1", name: "Team A" },
          { id: "2", name: "Team B" },
          2,
          1,
          "FINISHED",
          "A"
        ),
        createMatch(
          "2",
          { id: "3", name: "Team C" },
          { id: "4", name: "Team D" },
          1,
          0,
          "IN_PLAY",
          "A"
        ),
        createMatch(
          "3",
          { id: "1", name: "Team A" },
          { id: "3", name: "Team C" },
          null,
          null,
          "SCHEDULED",
          "A"
        ),
      ];

      const standings = calculateGroupStandings(matches);
      const groupA = standings.get("A");

      // Only Team A and Team B should have stats from the finished match
      const teamA = groupA!.find((s) => s.teamName === "Team A");
      const teamC = groupA!.find((s) => s.teamName === "Team C");

      expect(teamA!.played).toBe(1);
      expect(teamC).toBeUndefined(); // Team C's match isn't finished
    });

    it("should handle multiple groups", () => {
      const matches: Match[] = [
        createMatch(
          "1",
          { id: "1", name: "Team A1" },
          { id: "2", name: "Team A2" },
          2,
          1,
          "FINISHED",
          "A"
        ),
        createMatch(
          "2",
          { id: "3", name: "Team B1" },
          { id: "4", name: "Team B2" },
          1,
          0,
          "FINISHED",
          "B"
        ),
      ];

      const standings = calculateGroupStandings(matches);

      expect(standings.size).toBe(2);
      expect(standings.has("A")).toBe(true);
      expect(standings.has("B")).toBe(true);
    });
  });

  describe("rankThirdPlaceTeams", () => {
    it("should rank third place teams across groups", () => {
      const standings = new Map<string, GroupStanding[]>([
        [
          "A",
          [
            {
              teamId: "1",
              teamName: "A1",
              points: 9,
              goalDifference: 5,
              goalsFor: 7,
              played: 3,
              won: 3,
              drawn: 0,
              lost: 0,
              goalsAgainst: 2,
              group: "A",
            },
            {
              teamId: "2",
              teamName: "A2",
              points: 6,
              goalDifference: 2,
              goalsFor: 4,
              played: 3,
              won: 2,
              drawn: 0,
              lost: 1,
              goalsAgainst: 2,
              group: "A",
            },
            {
              teamId: "3",
              teamName: "A3",
              points: 4,
              goalDifference: 0,
              goalsFor: 3,
              played: 3,
              won: 1,
              drawn: 1,
              lost: 1,
              goalsAgainst: 3,
              group: "A",
            },
            {
              teamId: "4",
              teamName: "A4",
              points: 0,
              goalDifference: -7,
              goalsFor: 1,
              played: 3,
              won: 0,
              drawn: 0,
              lost: 3,
              goalsAgainst: 8,
              group: "A",
            },
          ],
        ],
        [
          "B",
          [
            {
              teamId: "5",
              teamName: "B1",
              points: 7,
              goalDifference: 3,
              goalsFor: 5,
              played: 3,
              won: 2,
              drawn: 1,
              lost: 0,
              goalsAgainst: 2,
              group: "B",
            },
            {
              teamId: "6",
              teamName: "B2",
              points: 5,
              goalDifference: 1,
              goalsFor: 4,
              played: 3,
              won: 1,
              drawn: 2,
              lost: 0,
              goalsAgainst: 3,
              group: "B",
            },
            {
              teamId: "7",
              teamName: "B3",
              points: 5,
              goalDifference: 0,
              goalsFor: 3,
              played: 3,
              won: 1,
              drawn: 2,
              lost: 0,
              goalsAgainst: 3,
              group: "B",
            },
            {
              teamId: "8",
              teamName: "B4",
              points: 1,
              goalDifference: -4,
              goalsFor: 2,
              played: 3,
              won: 0,
              drawn: 1,
              lost: 2,
              goalsAgainst: 6,
              group: "B",
            },
          ],
        ],
      ]);

      const ranked = rankThirdPlaceTeams(standings);

      expect(ranked).toHaveLength(2);
      // B3 should rank higher (5 pts vs 4 pts)
      expect(ranked[0].teamName).toBe("B3");
      expect(ranked[0].rank).toBe(1);
      expect(ranked[1].teamName).toBe("A3");
      expect(ranked[1].rank).toBe(2);
    });

    it("should use goal difference as tiebreaker", () => {
      const standings = new Map<string, GroupStanding[]>([
        [
          "A",
          [
            {
              teamId: "1",
              teamName: "A1",
              points: 9,
              goalDifference: 5,
              goalsFor: 7,
              played: 3,
              won: 3,
              drawn: 0,
              lost: 0,
              goalsAgainst: 2,
              group: "A",
            },
            {
              teamId: "2",
              teamName: "A2",
              points: 6,
              goalDifference: 2,
              goalsFor: 4,
              played: 3,
              won: 2,
              drawn: 0,
              lost: 1,
              goalsAgainst: 2,
              group: "A",
            },
            {
              teamId: "3",
              teamName: "A3",
              points: 4,
              goalDifference: 2,
              goalsFor: 5,
              played: 3,
              won: 1,
              drawn: 1,
              lost: 1,
              goalsAgainst: 3,
              group: "A",
            },
          ],
        ],
        [
          "B",
          [
            {
              teamId: "4",
              teamName: "B1",
              points: 7,
              goalDifference: 3,
              goalsFor: 5,
              played: 3,
              won: 2,
              drawn: 1,
              lost: 0,
              goalsAgainst: 2,
              group: "B",
            },
            {
              teamId: "5",
              teamName: "B2",
              points: 5,
              goalDifference: 1,
              goalsFor: 4,
              played: 3,
              won: 1,
              drawn: 2,
              lost: 0,
              goalsAgainst: 3,
              group: "B",
            },
            {
              teamId: "6",
              teamName: "B3",
              points: 4,
              goalDifference: 1,
              goalsFor: 3,
              played: 3,
              won: 1,
              drawn: 1,
              lost: 1,
              goalsAgainst: 2,
              group: "B",
            },
          ],
        ],
      ]);

      const ranked = rankThirdPlaceTeams(standings);

      // Both have 4 pts, but A3 has better GD (2 vs 1)
      expect(ranked[0].teamName).toBe("A3");
      expect(ranked[1].teamName).toBe("B3");
    });

    it("should use goals scored as final tiebreaker", () => {
      const standings = new Map<string, GroupStanding[]>([
        [
          "A",
          [
            {
              teamId: "1",
              teamName: "A1",
              points: 9,
              goalDifference: 5,
              goalsFor: 7,
              played: 3,
              won: 3,
              drawn: 0,
              lost: 0,
              goalsAgainst: 2,
              group: "A",
            },
            {
              teamId: "2",
              teamName: "A2",
              points: 6,
              goalDifference: 2,
              goalsFor: 4,
              played: 3,
              won: 2,
              drawn: 0,
              lost: 1,
              goalsAgainst: 2,
              group: "A",
            },
            {
              teamId: "3",
              teamName: "A3",
              points: 4,
              goalDifference: 0,
              goalsFor: 5,
              played: 3,
              won: 1,
              drawn: 1,
              lost: 1,
              goalsAgainst: 5,
              group: "A",
            },
          ],
        ],
        [
          "B",
          [
            {
              teamId: "4",
              teamName: "B1",
              points: 7,
              goalDifference: 3,
              goalsFor: 5,
              played: 3,
              won: 2,
              drawn: 1,
              lost: 0,
              goalsAgainst: 2,
              group: "B",
            },
            {
              teamId: "5",
              teamName: "B2",
              points: 5,
              goalDifference: 1,
              goalsFor: 4,
              played: 3,
              won: 1,
              drawn: 2,
              lost: 0,
              goalsAgainst: 3,
              group: "B",
            },
            {
              teamId: "6",
              teamName: "B3",
              points: 4,
              goalDifference: 0,
              goalsFor: 3,
              played: 3,
              won: 1,
              drawn: 1,
              lost: 1,
              goalsAgainst: 3,
              group: "B",
            },
          ],
        ],
      ]);

      const ranked = rankThirdPlaceTeams(standings);

      // Both have 4 pts and 0 GD, but A3 scored more (5 vs 3)
      expect(ranked[0].teamName).toBe("A3");
      expect(ranked[1].teamName).toBe("B3");
    });
  });

  describe("isTeamEliminated", () => {
    it("should eliminate 4th place teams after group stage", () => {
      const matches: Match[] = [
        createMatch("1", { id: "1", name: "A1" }, { id: "2", name: "A2" }, 3, 0, "FINISHED", "A"),
        createMatch("2", { id: "3", name: "A3" }, { id: "4", name: "A4" }, 2, 0, "FINISHED", "A"),
        createMatch("3", { id: "1", name: "A1" }, { id: "3", name: "A3" }, 1, 0, "FINISHED", "A"),
        createMatch("4", { id: "2", name: "A2" }, { id: "4", name: "A4" }, 1, 1, "FINISHED", "A"),
        createMatch("5", { id: "1", name: "A1" }, { id: "4", name: "A4" }, 2, 0, "FINISHED", "A"),
        createMatch("6", { id: "2", name: "A2" }, { id: "3", name: "A3" }, 0, 0, "FINISHED", "A"),
      ];

      const standings = calculateGroupStandings(matches);
      const thirdPlaceRankings = rankThirdPlaceTeams(standings);

      // Team A4 should be 4th and eliminated
      const groupA = standings.get("A");
      expect(groupA![3].teamId).toBe("4");
      expect(isTeamEliminated("4", matches, standings, thirdPlaceRankings)).toBe(true);
    });

    it("should eliminate bottom 4 third-place teams", () => {
      // Create 12 groups with 4 teams each, all matches completed
      const matches: Match[] = [];
      const teams: { [key: string]: { points: number; gd: number; gf: number } } = {};

      // Simulate 12 groups (A-L) with varying third-place results
      const thirdPlacePoints = [6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1]; // Top 8 get 6,6,5,5,4,4,3,3

      for (let g = 0; g < 12; g++) {
        const group = String.fromCharCode(65 + g); // A, B, C, ...
        const thirdPlaceTeamId = `${g}-3`;

        // Create simplified matches to give third place team specific points
        const wins = Math.floor(thirdPlacePoints[g] / 3);
        const draws = thirdPlacePoints[g] % 3;

        for (let m = 0; m < wins; m++) {
          matches.push(
            createMatch(
              `${g}-win-${m}`,
              { id: thirdPlaceTeamId, name: `${group}3` },
              { id: `${g}-opp-${m}`, name: `Opp${m}` },
              1,
              0,
              "FINISHED",
              group
            )
          );
        }
        for (let m = 0; m < draws; m++) {
          matches.push(
            createMatch(
              `${g}-draw-${m}`,
              { id: thirdPlaceTeamId, name: `${group}3` },
              { id: `${g}-opp-d-${m}`, name: `OppD${m}` },
              1,
              1,
              "FINISHED",
              group
            )
          );
        }

        // Add dummy matches for positions 1, 2, 4 to complete the group
        for (let pos = 0; pos < 4; pos++) {
          if (pos === 3) continue; // We already handled the third place team
          const teamId = `${g}-${pos}`;
          const dummyPoints = pos === 0 ? 9 : pos === 1 ? 6 : 0;
          for (let m = 0; m < Math.floor(dummyPoints / 3); m++) {
            matches.push(
              createMatch(
                `${g}-${pos}-${m}`,
                { id: teamId, name: `${group}${pos}` },
                { id: `${g}-${pos}-opp-${m}`, name: `Opp${m}` },
                2,
                0,
                "FINISHED",
                group
              )
            );
          }
        }
      }

      const standings = calculateGroupStandings(matches);
      const thirdPlaceRankings = rankThirdPlaceTeams(standings);

      // Teams ranked 9-12 should be eliminated
      const eliminatedThirdPlaceTeams = thirdPlaceRankings.filter((t) => t.rank > 8);
      expect(eliminatedThirdPlaceTeams.length).toBeGreaterThan(0);
    });

    it("should eliminate knockout losers", () => {
      const matches: Match[] = [
        createMatch(
          "knockout-1",
          { id: "1", name: "Team A" },
          { id: "2", name: "Team B" },
          2,
          1,
          "FINISHED",
          undefined,
          "ROUND_OF_16"
        ),
      ];

      const standings = calculateGroupStandings([]);
      const thirdPlaceRankings = rankThirdPlaceTeams(standings);

      // Team B lost knockout match
      expect(isTeamEliminated("2", matches, standings, thirdPlaceRankings)).toBe(true);
      // Team A won
      expect(isTeamEliminated("1", matches, standings, thirdPlaceRankings)).toBe(false);
    });

    it("should not eliminate teams before group stage is complete", () => {
      const matches: Match[] = [
        // Only 2 matches played in group
        createMatch("1", { id: "1", name: "A1" }, { id: "2", name: "A2" }, 3, 0, "FINISHED", "A"),
        createMatch("2", { id: "3", name: "A3" }, { id: "4", name: "A4" }, 2, 0, "FINISHED", "A"),
      ];

      const standings = calculateGroupStandings(matches);
      const thirdPlaceRankings = rankThirdPlaceTeams(standings);

      // No team should be eliminated yet
      expect(isTeamEliminated("1", matches, standings, thirdPlaceRankings)).toBe(false);
      expect(isTeamEliminated("2", matches, standings, thirdPlaceRankings)).toBe(false);
      expect(isTeamEliminated("4", matches, standings, thirdPlaceRankings)).toBe(false);
    });
  });

  describe("getEliminationStatus", () => {
    it("should return elimination status for all teams", () => {
      const matches: Match[] = [
        createMatch("1", { id: "1", name: "A1" }, { id: "2", name: "A2" }, 3, 0, "FINISHED", "A"),
        createMatch("2", { id: "3", name: "A3" }, { id: "4", name: "A4" }, 2, 0, "FINISHED", "A"),
        createMatch("3", { id: "1", name: "A1" }, { id: "3", name: "A3" }, 1, 0, "FINISHED", "A"),
        createMatch("4", { id: "2", name: "A2" }, { id: "4", name: "A4" }, 1, 1, "FINISHED", "A"),
        createMatch("5", { id: "1", name: "A1" }, { id: "4", name: "A4" }, 2, 0, "FINISHED", "A"),
        createMatch("6", { id: "2", name: "A2" }, { id: "3", name: "A3" }, 0, 0, "FINISHED", "A"),
      ];

      const status = getEliminationStatus(matches);

      expect(status.size).toBe(4);
      expect(status.get("1")).toBe(false); // 1st place
      expect(status.get("3")).toBe(false); // 2nd place
      expect(status.get("4")).toBe(true); // 4th place - eliminated
    });

    it("should handle empty matches", () => {
      const status = getEliminationStatus([]);
      expect(status.size).toBe(0);
    });
  });
});
