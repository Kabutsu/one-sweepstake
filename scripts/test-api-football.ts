import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables FIRST before any other imports
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// Now import after env is loaded
async function testAPIFootball() {
  const {
    getAPIFootballClient,
    mapAPIFootballStatus,
    loadTeamMappings,
  } = await import("../lib/api-football");

  console.log("🔍 Testing API-Football Integration...\n");

  // Verify API key is loaded
  console.log("🔑 API Key status:", process.env.API_FOOTBALL_API_KEY ? "✅ Loaded" : "❌ Not found");
  console.log();

  // Test 1: Load team mappings
  console.log("1️⃣ Testing team mapping load...");
  try {
    const teamMapping = loadTeamMappings();
    console.log(`✅ Loaded ${teamMapping.size} team mappings`);
    console.log(`   Sample: API-Football ID 16 → Football-Data ID ${teamMapping.get(16)} (Mexico)`);
    console.log(`   Sample: API-Football ID 2 → Football-Data ID ${teamMapping.get(2)} (France)\n`);
  } catch (error) {
    console.error("❌ Failed to load team mappings:", error);
    return;
  }

  // Test 2: Test status mapping
  console.log("2️⃣ Testing status mapping...");
  const testStatuses = ["1H", "HT", "2H", "FT", "PEN", "AET", "NS"];
  for (const status of testStatuses) {
    const mapped = mapAPIFootballStatus(status);
    console.log(`   ${status} → ${mapped}`);
  }
  console.log();

  // Test 3: Fetch live matches
  console.log("3️⃣ Testing API-Football live matches fetch...");
  try {
    const client = getAPIFootballClient();
    const liveMatches = await client.fetchLiveMatches(1); // World Cup
    console.log(`✅ Successfully fetched ${liveMatches.length} live World Cup matches\n`);

    if (liveMatches.length > 0) {
      console.log("📊 Live matches:");
      for (const match of liveMatches) {
        console.log(
          `   ${match.teams.home.name} ${match.goals.home} - ${match.goals.away} ${match.teams.away.name}`
        );
        console.log(`      Status: ${match.fixture.status.short} (${match.fixture.status.long})`);
        console.log(`      Mapped Status: ${mapAPIFootballStatus(match.fixture.status.short)}`);
        console.log(`      Home Team API-Football ID: ${match.teams.home.id}`);
        console.log(`      Away Team API-Football ID: ${match.teams.away.id}`);
        
        const teamMapping = loadTeamMappings();
        const homeTeamId = teamMapping.get(match.teams.home.id);
        const awayTeamId = teamMapping.get(match.teams.away.id);
        console.log(`      Home Team Football-Data ID: ${homeTeamId || 'NOT FOUND'}`);
        console.log(`      Away Team Football-Data ID: ${awayTeamId || 'NOT FOUND'}`);
        
        if (match.score.penalty.home !== null && match.score.penalty.away !== null) {
          console.log(
            `      Penalties: ${match.score.penalty.home} - ${match.score.penalty.away}`
          );
        }
        console.log();
      }
    } else {
      console.log("   No live matches currently\n");
    }
  } catch (error) {
    console.error("❌ Failed to fetch live matches:", error);
    if (error instanceof Error) {
      console.error("   Error message:", error.message);
    }
    return;
  }

  console.log("✅ All tests completed successfully!");
}

testAPIFootball().catch(console.error);
