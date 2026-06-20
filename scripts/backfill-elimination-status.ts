/**
 * Backfill script to populate elimination status for existing tournament data
 * Run this after adding the isEliminated column to teamsTournaments table
 *
 * Usage: npx tsx scripts/backfill-elimination-status.ts
 */

// Load environment variables from .env.local
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env.local") });

import { db } from "../db";
import { tournaments, matchCache, teams, teamsTournaments } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { calculateEliminationWithRankings, Match } from "../lib/elimination-tracker";

async function backfillEliminationStatus() {
  console.log("Starting elimination status backfill...\n");

  try {
    // Get all tournaments
    const allTournaments = await db.select().from(tournaments);

    if (allTournaments.length === 0) {
      console.log("No tournaments found.");
      return;
    }

    console.log(`Found ${allTournaments.length} tournament(s)\n`);

    for (const tournament of allTournaments) {
      console.log(`Processing tournament: ${tournament.name} (${tournament.id})`);

      // Get all matches for this tournament
      const matchRecords = await db
        .select()
        .from(matchCache)
        .where(eq(matchCache.tournamentId, tournament.id));

      console.log(`  - Found ${matchRecords.length} matches`);

      if (matchRecords.length === 0) {
        console.log(`  - No matches to process, skipping\n`);
        continue;
      }

      // Get all teams with their rankings for this tournament
      const teamRecords = await db
        .select({
          teamId: teamsTournaments.teamId,
          ranking: teamsTournaments.ranking,
        })
        .from(teamsTournaments)
        .where(eq(teamsTournaments.tournamentId, tournament.id));

      console.log(`  - Found ${teamRecords.length} teams`);

      // Build rankings map
      const teamRankings = new Map<string, number>();
      for (const team of teamRecords) {
        if (team.ranking) {
          teamRankings.set(team.teamId, team.ranking);
        }
      }

      // Get team details for enrichment
      const allTeams = await db.select().from(teams);
      const teamsMap = new Map(allTeams.map((t) => [t.id, t]));

      // Enrich matches with team names
      const enrichedMatches: Match[] = matchRecords.map((match) => ({
        apiMatchId: match.apiMatchId,
        homeTeamId: match.homeTeamId,
        homeTeamName: teamsMap.get(match.homeTeamId)?.name || match.homeTeamId,
        awayTeamId: match.awayTeamId,
        awayTeamName: teamsMap.get(match.awayTeamId)?.name || match.awayTeamId,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        status: match.status,
        stage: match.stage,
        rawData: match.rawData,
      }));

      // Calculate elimination status
      console.log(`  - Calculating elimination status...`);
      const eliminationStatus = calculateEliminationWithRankings(enrichedMatches, teamRankings);

      // Update database
      let updatedCount = 0;
      let eliminatedCount = 0;
      for (const [teamId, isEliminated] of eliminationStatus) {
        await db
          .update(teamsTournaments)
          .set({ isEliminated })
          .where(
            and(
              eq(teamsTournaments.teamId, teamId),
              eq(teamsTournaments.tournamentId, tournament.id)
            )
          );
        updatedCount++;
        if (isEliminated) eliminatedCount++;
      }

      console.log(`  - Updated ${updatedCount} teams (${eliminatedCount} eliminated)\n`);
    }

    console.log("✅ Backfill completed successfully!");
  } catch (error) {
    console.error("❌ Error during backfill:", error);
    process.exit(1);
  }
}

// Run the backfill
backfillEliminationStatus()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
