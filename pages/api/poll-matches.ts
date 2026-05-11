import type { NextApiRequest, NextApiResponse } from "next";
import { updateMatchCache } from "@/lib/match-cache";
import { db } from "@/db";
import { tournaments } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  const expectedAuth = `Bearer ${process.env.CRON_SECRET || "default-secret"}`;

  if (authHeader !== expectedAuth) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const activeTournaments = await db
      .select()
      .from(tournaments)
      .where(eq(tournaments.isActive, true));

    if (activeTournaments.length === 0) {
      return res.status(200).json({
        message: "No active tournaments to poll",
        results: [],
      });
    }

    const results = [];

    for (const tournament of activeTournaments) {
      const now = new Date();
      const startDate = new Date(tournament.startDate);
      const endDate = new Date(tournament.endDate);

      // Start caching matches 30 days before tournament starts
      const cacheStartDate = new Date(startDate);
      cacheStartDate.setDate(cacheStartDate.getDate() - 30);

      if (now < cacheStartDate || now > endDate) {
        results.push({
          tournamentId: tournament.id,
          tournamentName: tournament.name,
          skipped: true,
          reason: "Outside caching window (30 days before start to end date)",
        });
        continue;
      }

      try {
        const result = await updateMatchCache(tournament.apiId);
        results.push({
          tournamentId: tournament.id,
          tournamentName: tournament.name,
          ...result,
        });
      } catch (error) {
        results.push({
          tournamentId: tournament.id,
          tournamentName: tournament.name,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return res.status(200).json({
      message: "Match polling completed",
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error("Error polling matches:", error);
    return res.status(500).json({
      error: "Failed to poll matches",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
