import type { NextApiRequest, NextApiResponse } from "next";
import { updateMatchLiveResults } from "@/lib/match-cache";
import { db } from "@/db";
import { tournaments } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

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
        message: "No active tournaments to update",
        results: [],
      });
    }

    const results = [];

    for (const tournament of activeTournaments) {
      try {
        const result = await updateMatchLiveResults(tournament.id);
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
      message: "Live results update completed",
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error("Error updating live results:", error);
    return res.status(500).json({
      error: "Failed to update live results",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
