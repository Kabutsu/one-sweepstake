import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

interface Team {
  id: number;
  name: string;
  tla: string;
  crest: string;
}

interface FootballDataTeamsResponse {
  teams: Team[];
}

interface TeamMapping {
  teamName: string;
  footballAPIId: number | null;
  APIFootballId: number | null;
}

async function fetchTeamsFromFootballData(): Promise<Team[]> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    throw new Error("FOOTBALL_DATA_API_KEY not found in environment variables");
  }

  const competitionId = "2000"; // World Cup 2026
  const url = `https://api.football-data.org/v4/competitions/${competitionId}/teams`;

  console.log(`Fetching teams from: ${url}`);

  const response = await fetch(url, {
    headers: {
      "X-Auth-Token": apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Football Data API error: ${response.status} ${response.statusText}`);
  }

  const data: FootballDataTeamsResponse = await response.json();
  return data.teams;
}

async function main() {
  try {
    console.log("Fetching teams from football-data.org API...");
    const teams = await fetchTeamsFromFootballData();

    console.log(`Found ${teams.length} teams`);

    // Create mapping entries
    const mappings: { mapping: TeamMapping[] } = {
      mapping: teams.map((team) => ({
        teamName: team.name,
        footballAPIId: team.id,
        APIFootballId: null,
      })),
    };

    // Write to team-mapping.json
    const outputPath = path.resolve(process.cwd(), "scripts", "team-mapping.json");
    fs.writeFileSync(outputPath, JSON.stringify(mappings, null, 2), "utf-8");

    console.log(`✅ Successfully wrote ${teams.length} teams to ${outputPath}`);
    console.log("\nSample entries:");
    mappings.mapping.slice(0, 3).forEach((entry) => {
      console.log(`  - ${entry.teamName} (footballAPIId: ${entry.footballAPIId})`);
    });
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
