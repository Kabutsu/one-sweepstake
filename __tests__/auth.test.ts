import { describe, it, expect, vi, beforeAll } from "vitest";

// Mock the database module before importing auth
vi.mock("@/db", () => ({
  db: {},
  client: {},
}));

// Set required env vars for testing
beforeAll(() => {
  process.env.POSTGRES_URL = "postgresql://test:test@localhost:5432/test";
  process.env.JWT_SECRET = "test-secret-key-for-testing-only";
});

const { createToken, verifyToken } = await import("../lib/auth");

describe("Authentication", () => {
  describe("Token generation and verification", () => {
    it("should create a valid JWT token", async () => {
      const userId = "test-user-123";
      const token = await createToken(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
    });

    it("should verify a valid token and return userId", async () => {
      const userId = "test-user-456";
      const token = await createToken(userId);
      const verifiedUserId = await verifyToken(token);

      expect(verifiedUserId).toBe(userId);
    });

    it("should return null for an invalid token", async () => {
      const invalidToken = "invalid.token.here";
      const result = await verifyToken(invalidToken);

      expect(result).toBeNull();
    });

    it("should return null for an expired token", async () => {
      const expiredToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0IiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDAwMDF9.invalid";
      const result = await verifyToken(expiredToken);

      expect(result).toBeNull();
    });

    it("should create different tokens for different users", async () => {
      const userId1 = "user-1";
      const userId2 = "user-2";

      const token1 = await createToken(userId1);
      const token2 = await createToken(userId2);

      expect(token1).not.toBe(token2);

      const verified1 = await verifyToken(token1);
      const verified2 = await verifyToken(token2);

      expect(verified1).toBe(userId1);
      expect(verified2).toBe(userId2);
    });

    it("should handle empty userId", async () => {
      const token = await createToken("");
      const verified = await verifyToken(token);

      expect(verified).toBe("");
    });
  });

  describe("Token security", () => {
    it("should not allow token tampering", async () => {
      const userId = "legitimate-user";
      const token = await createToken(userId);

      const parts = token.split(".");
      if (parts.length === 3) {
        const tamperedToken = parts[0] + "." + parts[1] + ".tampered";
        const result = await verifyToken(tamperedToken);

        expect(result).toBeNull();
      }
    });
  });
});
