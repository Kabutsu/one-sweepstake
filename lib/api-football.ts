export interface APIFootballMatch {
  fixture: {
    id: number;
    referee: string | null;
    timezone: string;
    date: string;
    timestamp: number;
    periods: {
      first: number | null;
      second: number | null;
    };
    venue: {
      id: number | null;
      name: string | null;
      city: string | null;
    };
    status: {
      long: string;
      short: string;
      elapsed: number | null;
      extra: number | null;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string | null;
    season: number;
    round: string;
    standings: boolean;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
    away: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime: {
      home: number | null;
      away: number | null;
    };
    fulltime: {
      home: number | null;
      away: number | null;
    };
    extratime: {
      home: number | null;
      away: number | null;
    };
    penalty: {
      home: number | null;
      away: number | null;
    };
  };
  events: Array<{
    time: {
      elapsed: number;
      extra: number | null;
    };
    team: {
      id: number;
      name: string;
      logo: string;
    };
    player: {
      id: number | null;
      name: string | null;
    };
    assist: {
      id: number | null;
      name: string | null;
    };
    type: string;
    detail: string;
    comments: string | null;
  }>;
}

export interface APIFootballResponse {
  get: string;
  parameters: Record<string, string>;
  errors: any[];
  results: number;
  paging: {
    current: number;
    total: number;
  };
  response: APIFootballMatch[];
}

export class APIFootballError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public responseBody?: string
  ) {
    super(message);
    this.name = "APIFootballError";
  }
}

/**
 * Map API-Football status codes to football-data.org status format
 */
export function mapAPIFootballStatus(status: string): string {
  const statusMap: Record<string, string> = {
    // Not started
    TBD: "SCHEDULED",
    NS: "SCHEDULED",
    // Live statuses
    "1H": "IN_PLAY",
    HT: "PAUSED",
    "2H": "IN_PLAY",
    ET: "IN_PLAY",
    BT: "PAUSED", // Break time in extra time
    P: "IN_PLAY", // Penalties
    // Finished
    FT: "FINISHED",
    AET: "FINISHED", // After extra time
    PEN: "FINISHED", // After penalties
    // Special cases
    SUSP: "SUSPENDED",
    INT: "SUSPENDED",
    PST: "POSTPONED",
    CANC: "CANCELLED",
    ABD: "CANCELLED",
    AWD: "AWARDED",
    WO: "AWARDED", // Walkover
  };

  return statusMap[status] || status;
}

/**
 * Load team ID mappings from JSON file
 */
export function loadTeamMappings(): Map<number, string> {
  const fs = require("fs");
  const path = require("path");

  const mappingPath = path.resolve(process.cwd(), "scripts/team-mapping.json");
  const mappingData = JSON.parse(fs.readFileSync(mappingPath, "utf-8"));

  const map = new Map<number, string>();

  for (const entry of mappingData.mapping) {
    // Map from API-Football ID to football-data.org ID
    map.set(entry.APIFootballId, String(entry.footballAPIId));
  }

  return map;
}

export class APIFootballClient {
  private apiKey: string;
  private baseUrl = "https://v3.football.api-sports.io";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.API_FOOTBALL_API_KEY || "";
    if (!this.apiKey) {
      throw new Error("API-Football API key is required");
    }
  }

  async fetchLiveMatches(leagueId: number): Promise<APIFootballMatch[]> {
    try {
      const url = `${this.baseUrl}/fixtures?live=all&league=${leagueId}`;
      const response = await fetch(url, {
        headers: {
          "x-apisports-key": this.apiKey,
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new APIFootballError(
          `Failed to fetch live matches: ${response.statusText}`,
          response.status,
          errorBody
        );
      }

      const data: APIFootballResponse = await response.json();

      // Check for API errors
      if (data.errors && data.errors.length > 0) {
        throw new APIFootballError(
          `API-Football returned errors: ${JSON.stringify(data.errors)}`,
          response.status,
          JSON.stringify(data.errors)
        );
      }

      return data.response;
    } catch (error) {
      if (error instanceof APIFootballError) {
        throw error;
      }
      throw new APIFootballError(
        `Network error while fetching live matches: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

let _apiFootballClient: APIFootballClient | null = null;

export const getAPIFootballClient = (): APIFootballClient => {
  if (!_apiFootballClient) {
    _apiFootballClient = new APIFootballClient();
  }
  return _apiFootballClient;
};
