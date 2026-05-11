import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";

const originalEnv = process.env.FOOTBALL_DATA_API_KEY;

beforeAll(() => {
  process.env.FOOTBALL_DATA_API_KEY = "test-key-for-testing";
});

afterAll(() => {
  if (originalEnv) {
    process.env.FOOTBALL_DATA_API_KEY = originalEnv;
  } else {
    delete process.env.FOOTBALL_DATA_API_KEY;
  }
});

const { FootballDataAPIClient, FootballDataAPIError } = await import("../lib/football-data-api");

describe("FootballDataAPIClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Constructor", () => {
    it("should throw error if API key is not provided", () => {
      const originalEnv = process.env.FOOTBALL_DATA_API_KEY;
      delete process.env.FOOTBALL_DATA_API_KEY;

      expect(() => new FootballDataAPIClient()).toThrow("Football Data API key is required");

      process.env.FOOTBALL_DATA_API_KEY = originalEnv;
    });

    it("should use provided API key", () => {
      const client = new FootballDataAPIClient("test-api-key");
      expect(client).toBeDefined();
    });

    it("should use environment variable API key", () => {
      process.env.FOOTBALL_DATA_API_KEY = "env-api-key";
      const client = new FootballDataAPIClient();
      expect(client).toBeDefined();
    });
  });

  describe("fetchMatchesByCompetition", () => {
    it("should fetch matches successfully", async () => {
      const mockMatches = [
        {
          id: 1,
          utcDate: "2026-06-11T15:00:00Z",
          status: "SCHEDULED",
          homeTeam: { id: 1, name: "Team A" },
          awayTeam: { id: 2, name: "Team B" },
          score: {
            fullTime: { home: null, away: null },
          },
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ matches: mockMatches }),
      });

      const client = new FootballDataAPIClient("test-key");
      const matches = await client.fetchMatchesByCompetition("WC");

      expect(matches).toEqual(mockMatches);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.football-data.org/v4/competitions/WC/matches",
        {
          headers: { "X-Auth-Token": "test-key" },
        }
      );
    });

    it("should throw FootballDataAPIError on API failure", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        text: async () => "Competition not found",
      });

      const client = new FootballDataAPIClient("test-key");

      await expect(client.fetchMatchesByCompetition("INVALID")).rejects.toThrow(
        FootballDataAPIError
      );
      await expect(client.fetchMatchesByCompetition("INVALID")).rejects.toThrow(
        "Failed to fetch matches: Not Found"
      );
    });

    it("should handle network errors", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      const client = new FootballDataAPIClient("test-key");

      await expect(client.fetchMatchesByCompetition("WC")).rejects.toThrow(FootballDataAPIError);
      await expect(client.fetchMatchesByCompetition("WC")).rejects.toThrow(
        "Network error while fetching matches"
      );
    });
  });

  describe("fetchMatchById", () => {
    it("should fetch a single match successfully", async () => {
      const mockMatch = {
        id: 123,
        utcDate: "2026-06-11T15:00:00Z",
        status: "FINISHED",
        homeTeam: { id: 1, name: "Team A" },
        awayTeam: { id: 2, name: "Team B" },
        score: {
          fullTime: { home: 2, away: 1 },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockMatch,
      });

      const client = new FootballDataAPIClient("test-key");
      const match = await client.fetchMatchById("123");

      expect(match).toEqual(mockMatch);
      expect(global.fetch).toHaveBeenCalledWith("https://api.football-data.org/v4/matches/123", {
        headers: { "X-Auth-Token": "test-key" },
      });
    });

    it("should throw FootballDataAPIError when match not found", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        text: async () => "Match not found",
      });

      const client = new FootballDataAPIClient("test-key");

      await expect(client.fetchMatchById("999")).rejects.toThrow(FootballDataAPIError);
      await expect(client.fetchMatchById("999")).rejects.toThrow(
        "Failed to fetch match: Not Found"
      );
    });
  });

  describe("FootballDataAPIError", () => {
    it("should include status code and response body", () => {
      const error = new FootballDataAPIError("Test error", 404, "Not found");

      expect(error.message).toBe("Test error");
      expect(error.statusCode).toBe(404);
      expect(error.responseBody).toBe("Not found");
      expect(error.name).toBe("FootballDataAPIError");
    });
  });
});
