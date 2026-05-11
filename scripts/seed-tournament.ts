import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

// Load environment variables from .env.local FIRST
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// Types for seeding configuration
export interface TeamSeeding {
  id?: string;
  name: string;
  tla: string;
  crest: string;
  ranking?: number;
}

export interface SeedingConfig {
  teams: TeamSeeding[];
}

/**
 * Load team seeding data from JSON file
 */
export function loadSeedingData(filePath: string): TeamSeeding[] {
  const jsonPath = path.resolve(process.cwd(), filePath);
  const fileContent = fs.readFileSync(jsonPath, "utf-8");
  const teams: TeamSeeding[] = JSON.parse(fileContent);
  
  // Add ranking based on array position (1-indexed)
  return teams.map((team, index) => ({
    ...team,
    ranking: index + 1,
  }));
}

/**
 * Fetch teams from Football Data API and enrich with IDs
 */
export async function enrichTeamsFromAPI(
  teams: TeamSeeding[],
  apiKey: string
): Promise<TeamSeeding[]> {
  try {
    const response = await fetch(
      "https://api.football-data.org/v4/competitions/2000/teams",
      {
        headers: {
          "X-Auth-Token": apiKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Football Data API error: ${response.statusText}`);
    }

    const data = await response.json();
    const apiTeams = data.teams || [];

    // Create a map of TLA to team data from API
    const apiTeamMap = new Map(
      apiTeams.map((team: any) => [team.tla, {
        id: team.id.toString(),
        name: team.name,
        crest: team.crest,
      }])
    );

    // Enrich our seeding data with API data
    return teams.map((team) => {
      const apiTeam = apiTeamMap.get(team.tla);
      if (apiTeam) {
        return {
          ...team,
          id: apiTeam.id,
          name: apiTeam.name, // Use official API name
          crest: apiTeam.crest, // Use official API crest URL
        };
      }
      return team;
    });
  } catch (error) {
    console.error("Failed to fetch from Football Data API:", error);
    // Return original teams if API fetch fails
    return teams;
  }
}

/**
 * Update tournament with seeding configuration
 */
export async function updateTournamentSeeding(
  tournamentId: string,
  seedingConfig: SeedingConfig
): Promise<void> {
  const { db } = await import("../db");
  const { tournaments } = await import("../db/schema");
  const { eq } = await import("drizzle-orm");
  
  await db
    .update(tournaments)
    .set({
      seedingConfig: seedingConfig as any,
      updatedAt: new Date(),
    })
    .where(eq(tournaments.id, tournamentId));
}

/**
 * Get tournament seeding configuration
 */
export async function getTournamentSeeding(
  tournamentId: string
): Promise<SeedingConfig | null> {
  const { db } = await import("../db");
  const { tournaments } = await import("../db/schema");
  const { eq } = await import("drizzle-orm");
  
  const [tournament] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.id, tournamentId))
    .limit(1);

  if (!tournament || !tournament.seedingConfig) {
    return null;
  }

  return tournament.seedingConfig as SeedingConfig;
}

/**
 * Main seeding function - combines all steps
 */
export async function seedWorldCup2026(
  tournamentId: string,
  seedingFilePath: string = "scripts/world-cup-2026-seeding.json",
  apiKey?: string
): Promise<void> {
  console.log("Loading seeding data from file...");
  let teams = loadSeedingData(seedingFilePath);

  if (apiKey) {
    console.log("Enriching teams with Football Data API...");
    teams = await enrichTeamsFromAPI(teams, apiKey);
  }

  const seedingConfig: SeedingConfig = { teams };

  console.log(`Updating tournament ${tournamentId} with ${teams.length} teams...`);
  await updateTournamentSeeding(tournamentId, seedingConfig);

  console.log("✓ World Cup 2026 seeding complete!");
  console.log(`  ${teams.length} teams ranked 1-${teams.length}`);
}

// CLI execution
if (require.main === module) {
  const tournamentId = process.env.TOURNAMENT_ID || "6ad09dcf-d6ed-434a-974b-055e587c5a45";
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;

  seedWorldCup2026(tournamentId, "scripts/world-cup-2026-seeding.json", apiKey)
    .then(() => {
      console.log("Seeding successful!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    });
}
