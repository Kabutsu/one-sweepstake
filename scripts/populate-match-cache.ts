import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables BEFORE importing anything else
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { db } from "../db";
import { tournaments } from "../db/schema";
import { eq } from "drizzle-orm";
import { updateMatchCache } from "../lib/match-cache";

async function populateMatchCache() {
  console.log("🔄 Starting match cache population...");

  try {
    const activeTournaments = await db
      .select()
      .from(tournaments)
      .where(eq(tournaments.isActive, true));

    if (activeTournaments.length === 0) {
      console.log("⚠️  No active tournaments found");
      return;
    }

    for (const tournament of activeTournaments) {
      console.log(`\n📊 Processing: ${tournament.name}`);
      console.log(`   API ID: ${tournament.apiId}`);
      console.log(`   Start: ${tournament.startDate}`);
      console.log(`   End: ${tournament.endDate}`);

      try {
        const result = await updateMatchCache(tournament.apiId);
        console.log(`   ✅ Created: ${result.created}`);
        console.log(`   🔄 Updated: ${result.updated}`);
        if (result.deleted > 0) {
          console.log(`   🗑️  Deleted: ${result.deleted} old matches`);
        }

        if (result.errors.length > 0) {
          console.log(`   ⚠️  Errors: ${result.errors.length}`);
          result.errors.forEach((err) => console.log(`      - ${err}`));
        }
      } catch (error) {
        console.error(`   ❌ Failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    console.log("\n✨ Match cache population complete!");
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  }

  process.exit(0);
}

if (require.main === module) {
  populateMatchCache();
}

export { populateMatchCache };
