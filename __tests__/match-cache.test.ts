import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";

const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
};

const mockFootballDataAPI = {
  fetchMatchesByCompetition: vi.fn(),
};

vi.mock("@/lib/football-data-api", () => ({
  getFootballDataAPI: () => mockFootballDataAPI,
  FootballDataAPIError: class FootballDataAPIError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "FootballDataAPIError";
    }
  },
}));

vi.mock("@/db", () => ({
  db: mockDb,
}));

vi.mock("@/db/schema", () => ({
  matchCache: {
    id: "id",
    apiMatchId: "api_match_id",
    tournamentId: "tournament_id",
  },
  tournaments: {
    id: "id",
    apiId: "api_id",
    startDate: "start_date",
    endDate: "end_date",
  },
}));

beforeAll(() => {
  process.env.POSTGRES_URL = "postgresql://test:test@localhost:5432/test";
  process.env.FOOTBALL_DATA_API_KEY = "test-key";
});

const { updateMatchCache, shouldPollMatches } = await import("../lib/match-cache");

describe("Match Cache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("updateMatchCache", () => {
    it("should create new matches in cache", async () => {
      const mockTournament = {
        id: "tournament-123",
        apiId: "WC",
        name: "World Cup 2026",
      };

      const mockMatches = [
        {
          id: 1,
          utcDate: "2026-06-11T15:00:00Z",
          status: "SCHEDULED",
          homeTeam: { id: 101, name: "Team A" },
          awayTeam: { id: 102, name: "Team B" },
          score: {
            fullTime: { home: null, away: null },
          },
        },
      ];

      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockTournament]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        });

      (mockFootballDataAPI.fetchMatchesByCompetition as any).mockResolvedValue(mockMatches);

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      const result = await updateMatchCache("WC");

      expect(result.created).toBe(1);
      expect(result.updated).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it("should handle tournament not found", async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await updateMatchCache("INVALID");

      expect(result.created).toBe(0);
      expect(result.updated).toBe(0);
      expect(result.errors).toContain("Tournament with API ID INVALID not found");
    });

    it("should handle API errors gracefully", async () => {
      const mockTournament = {
        id: "tournament-123",
        apiId: "WC",
      };

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockTournament]),
          }),
        }),
      });

      (mockFootballDataAPI.fetchMatchesByCompetition as any).mockRejectedValue(
        new Error("API error")
      );

      const result = await updateMatchCache("WC");

      expect(result.created).toBe(0);
      expect(result.updated).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain("Failed to update match cache");
    });
  });

  describe("shouldPollMatches", () => {
    it("should return true for active tournament within dates", async () => {
      const now = new Date();
      const startDate = new Date(now.getTime() - 86400000);
      const endDate = new Date(now.getTime() + 86400000);

      const mockTournament = {
        id: "tournament-123",
        startDate,
        endDate,
      };

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockTournament]),
          }),
        }),
      });

      const result = await shouldPollMatches("tournament-123");

      expect(result).toBe(true);
    });

    it("should return false for tournament before start date", async () => {
      const now = new Date();
      const startDate = new Date(now.getTime() + 86400000);
      const endDate = new Date(now.getTime() + 172800000);

      const mockTournament = {
        id: "tournament-123",
        startDate,
        endDate,
      };

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockTournament]),
          }),
        }),
      });

      const result = await shouldPollMatches("tournament-123");

      expect(result).toBe(false);
    });

    it("should return false for tournament after end date", async () => {
      const now = new Date();
      const startDate = new Date(now.getTime() - 172800000);
      const endDate = new Date(now.getTime() - 86400000);

      const mockTournament = {
        id: "tournament-123",
        startDate,
        endDate,
      };

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockTournament]),
          }),
        }),
      });

      const result = await shouldPollMatches("tournament-123");

      expect(result).toBe(false);
    });

    it("should return false for non-existent tournament", async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await shouldPollMatches("non-existent");

      expect(result).toBe(false);
    });
  });
});
