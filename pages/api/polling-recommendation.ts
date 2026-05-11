import type { NextApiRequest, NextApiResponse } from "next";
import { getPollingRecommendation } from "@/lib/match-cache";
import { db } from "@/db";
import { tournaments } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const activeTournaments = await db
      .select()
      .from(tournaments)
      .where(eq(tournaments.isActive, true));

    if (activeTournaments.length === 0) {
      return res.status(200).json({
        message: "No active tournaments",
        recommendations: [],
      });
    }

    const recommendations = await Promise.all(
      activeTournaments.map(async (tournament) => {
        const recommendation = await getPollingRecommendation(tournament.id);
        return {
          tournamentId: tournament.id,
          tournamentName: tournament.name,
          startDate: tournament.startDate,
          endDate: tournament.endDate,
          ...recommendation,
        };
      })
    );

    // Find the most aggressive polling interval needed
    const activeRecommendations = recommendations.filter((r) => r.shouldPoll);
    const minInterval = activeRecommendations.length
      ? Math.min(...activeRecommendations.map((r) => r.intervalMinutes))
      : 1440;

    return res.status(200).json({
      message: "Polling recommendations",
      recommendedIntervalMinutes: minInterval,
      tournaments: recommendations,
    });
  } catch (error) {
    console.error("Error getting polling recommendations:", error);
    return res.status(500).json({
      error: "Failed to get polling recommendations",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
