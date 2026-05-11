export interface FootballDataMatch {
  id: number;
  utcDate: string;
  status:
    | "SCHEDULED"
    | "TIMED"
    | "IN_PLAY"
    | "PAUSED"
    | "FINISHED"
    | "SUSPENDED"
    | "POSTPONED"
    | "CANCELLED"
    | "AWARDED";
  homeTeam: {
    id: number;
    name: string;
  };
  awayTeam: {
    id: number;
    name: string;
  };
  score: {
    fullTime: {
      home: number | null;
      away: number | null;
    };
  };
}

export interface FootballDataResponse {
  matches: FootballDataMatch[];
}

export class FootballDataAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public responseBody?: string
  ) {
    super(message);
    this.name = "FootballDataAPIError";
  }
}

export class FootballDataAPIClient {
  private apiKey: string;
  private baseUrl = "https://api.football-data.org/v4";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.FOOTBALL_DATA_API_KEY || "";
    if (!this.apiKey) {
      throw new Error("Football Data API key is required");
    }
  }

  async fetchMatchesByCompetition(competitionId: string): Promise<FootballDataMatch[]> {
    try {
      const url = `${this.baseUrl}/competitions/${competitionId}/matches`;
      const response = await fetch(url, {
        headers: {
          "X-Auth-Token": this.apiKey,
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new FootballDataAPIError(
          `Failed to fetch matches: ${response.statusText}`,
          response.status,
          errorBody
        );
      }

      const data: FootballDataResponse = await response.json();
      return data.matches;
    } catch (error) {
      if (error instanceof FootballDataAPIError) {
        throw error;
      }
      throw new FootballDataAPIError(
        `Network error while fetching matches: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async fetchMatchById(matchId: string): Promise<FootballDataMatch> {
    try {
      const url = `${this.baseUrl}/matches/${matchId}`;
      const response = await fetch(url, {
        headers: {
          "X-Auth-Token": this.apiKey,
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new FootballDataAPIError(
          `Failed to fetch match: ${response.statusText}`,
          response.status,
          errorBody
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof FootballDataAPIError) {
        throw error;
      }
      throw new FootballDataAPIError(
        `Network error while fetching match: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

let _footballDataAPI: FootballDataAPIClient | null = null;

export const getFootballDataAPI = (): FootballDataAPIClient => {
  if (!_footballDataAPI) {
    _footballDataAPI = new FootballDataAPIClient();
  }
  return _footballDataAPI;
};
