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

  return teams;
}

/**
 * Fetch teams from Football Data API and enrich with IDs
 */
export async function enrichTeamsFromAPI(
  teams: TeamSeeding[],
  apiKey: string
): Promise<TeamSeeding[]> {
  try {
    const response = await fetch("https://api.football-data.org/v4/competitions/2000/teams", {
      headers: {
        "X-Auth-Token": apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Football Data API error: ${response.statusText}`);
    }

    const data = await response.json();
    const apiTeams = data.teams || [];

    // Create a map of TLA to team data from API
    const apiTeamMap = new Map<string, { id: string; name: string; crest: string }>(
      apiTeams.map((team: any) => [
        team.tla,
        {
          id: team.id.toString(),
          name: team.name,
          crest: team.crest,
        },
      ])
    );

    // Enrich our seeding data with API data
    return teams.map((team) => {
      const apiTeam = apiTeamMap.get(team.tla);
      if (apiTeam) {
        return {
          ...team,
          id: apiTeam.id,
          name: team.name ?? apiTeam.name, // Use official API name if not provided
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
  const { tournaments, teams, teamsTournaments } = await import("../db/schema");
  const { eq } = await import("drizzle-orm");

  // Insert teams into teams table (ignore duplicates)
  for (const team of seedingConfig.teams) {
    if (!team.id) {
      console.warn(`Skipping team ${team.name} - no ID available`);
      continue;
    }

    await db
      .insert(teams)
      .values({
        id: team.id,
        name: team.name,
        tla: team.tla,
        crest: team.crest,
      })
      .onConflictDoNothing();
  }

  // Insert team-tournament relationships
  for (const team of seedingConfig.teams) {
    if (!team.id) continue;

    await db
      .insert(teamsTournaments)
      .values({
        teamId: team.id,
        tournamentId: tournamentId,
        ranking: team.ranking,
      })
      .onConflictDoNothing();
  }

  // Update tournament timestamp
  await db
    .update(tournaments)
    .set({
      updatedAt: new Date(),
    })
    .where(eq(tournaments.id, tournamentId));
}

/**
 * Get tournament seeding configuration
 */
export async function getTournamentSeeding(tournamentId: string): Promise<SeedingConfig | null> {
  const { db } = await import("../db");
  const { teams, teamsTournaments } = await import("../db/schema");
  const { eq } = await import("drizzle-orm");

  const teamRecords = await db
    .select({
      id: teams.id,
      name: teams.name,
      tla: teams.tla,
      crest: teams.crest,
      ranking: teamsTournaments.ranking,
    })
    .from(teamsTournaments)
    .innerJoin(teams, eq(teamsTournaments.teamId, teams.id))
    .where(eq(teamsTournaments.tournamentId, tournamentId));

  if (teamRecords.length === 0) {
    return null;
  }

  return {
    teams: teamRecords.map((t) => ({
      id: t.id,
      name: t.name,
      tla: t.tla || "",
      crest: t.crest || "",
      ranking: t.ranking || undefined,
    })),
  };
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
