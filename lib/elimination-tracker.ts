/**
 * Team elimination tracking for tournaments
 *
 * For 2026 FIFA World Cup:
 * - 48 teams in 12 groups of 4
 * - Top 2 from each group advance (24 teams)
 * - Best 8 third-placed teams advance (8 teams)
 * - Total 32 teams advance to knockout
 */

export interface Match {
  apiMatchId: string;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  stage: string | null;
  rawData: any;
}

export interface GroupStanding {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  group: string;
}

export interface ThirdPlaceRanking {
  teamId: string;
  teamName: string;
  group: string;
  points: number;
  goalDifference: number;
  goalsFor: number;
  rank: number;
}

/**
 * Extract group identifier from match data
 */
function getGroupFromMatch(match: Match): string | null {
  if (match.rawData?.group) {
    return match.rawData.group.split("_")[1] || match.rawData.group;
  }

  // Fallback: try to extract from stage
  if (match.stage?.includes("GROUP")) {
    const groupMatch = match.stage.match(/GROUP[_\s]([A-L])/i);
    if (groupMatch) {
      return groupMatch[1].toUpperCase();
    }
  }

  return null;
}

/**
 * Check if a match is a group stage match
 */
function isGroupStageMatch(match: Match): boolean {
  return (
    match.stage?.includes("GROUP_STAGE") ||
    match.stage?.includes("GROUP") ||
    match.rawData?.stage === "GROUP_STAGE" ||
    false
  );
}

/**
 * Check if a match is a knockout stage match
 */
function isKnockoutMatch(match: Match): boolean {
  if (!match.stage) return false;

  const knockoutStages = [
    "ROUND_OF_32",
    "ROUND_OF_16",
    "LAST_16",
    "QUARTER_FINALS",
    "SEMI_FINALS",
    "THIRD_PLACE",
    "FINAL",
  ];

  return knockoutStages.some((stage) => match.stage?.includes(stage));
}

/**
 * Calculate group standings from match results
 */
export function calculateGroupStandings(matches: Match[]): Map<string, GroupStanding[]> {
  const groupMatches = matches.filter(
    (m) =>
      isGroupStageMatch(m) &&
      m.status === "FINISHED" &&
      m.homeScore !== null &&
      m.awayScore !== null
  );

  // Initialize standings map
  const standingsMap = new Map<string, Map<string, GroupStanding>>();

  // Process each match
  for (const match of groupMatches) {
    const group = getGroupFromMatch(match);
    if (!group) continue;

    if (!standingsMap.has(group)) {
      standingsMap.set(group, new Map());
    }

    const groupStandings = standingsMap.get(group)!;

    // Initialize home team
    if (!groupStandings.has(match.homeTeamId)) {
      groupStandings.set(match.homeTeamId, {
        teamId: match.homeTeamId,
        teamName: match.homeTeamName,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        group,
      });
    }

    // Initialize away team
    if (!groupStandings.has(match.awayTeamId)) {
      groupStandings.set(match.awayTeamId, {
        teamId: match.awayTeamId,
        teamName: match.awayTeamName,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        group,
      });
    }

    const homeTeam = groupStandings.get(match.homeTeamId)!;
    const awayTeam = groupStandings.get(match.awayTeamId)!;

    // Update statistics
    homeTeam.played++;
    awayTeam.played++;

    homeTeam.goalsFor += match.homeScore!;
    homeTeam.goalsAgainst += match.awayScore!;
    awayTeam.goalsFor += match.awayScore!;
    awayTeam.goalsAgainst += match.homeScore!;

    if (match.homeScore! > match.awayScore!) {
      homeTeam.won++;
      homeTeam.points += 3;
      awayTeam.lost++;
    } else if (match.homeScore! < match.awayScore!) {
      awayTeam.won++;
      awayTeam.points += 3;
      homeTeam.lost++;
    } else {
      homeTeam.drawn++;
      awayTeam.drawn++;
      homeTeam.points++;
      awayTeam.points++;
    }

    homeTeam.goalDifference = homeTeam.goalsFor - homeTeam.goalsAgainst;
    awayTeam.goalDifference = awayTeam.goalsFor - awayTeam.goalsAgainst;
  }

  // Sort each group's standings
  const sortedStandings = new Map<string, GroupStanding[]>();

  for (const [group, standings] of standingsMap) {
    const sorted = Array.from(standings.values()).sort((a, b) => {
      // 1. Points
      if (a.points !== b.points) return b.points - a.points;
      // 2. Goal difference
      if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference;
      // 3. Goals scored
      if (a.goalsFor !== b.goalsFor) return b.goalsFor - a.goalsFor;
      // 4. Alphabetical as final tiebreaker
      return a.teamName.localeCompare(b.teamName);
    });

    sortedStandings.set(group, sorted);
  }

  return sortedStandings;
}

/**
 * Rank third-place teams across all groups
 */
export function rankThirdPlaceTeams(
  groupStandings: Map<string, GroupStanding[]>
): ThirdPlaceRanking[] {
  const thirdPlaceTeams: ThirdPlaceRanking[] = [];

  for (const [group, standings] of groupStandings) {
    if (standings.length >= 3) {
      const thirdPlace = standings[2];
      thirdPlaceTeams.push({
        teamId: thirdPlace.teamId,
        teamName: thirdPlace.teamName,
        group,
        points: thirdPlace.points,
        goalDifference: thirdPlace.goalDifference,
        goalsFor: thirdPlace.goalsFor,
        rank: 0, // Will be assigned after sorting
      });
    }
  }

  // Sort third-place teams
  thirdPlaceTeams.sort((a, b) => {
    // 1. Points
    if (a.points !== b.points) return b.points - a.points;
    // 2. Goal difference
    if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference;
    // 3. Goals scored
    if (a.goalsFor !== b.goalsFor) return b.goalsFor - a.goalsFor;
    // 4. Alphabetical
    return a.teamName.localeCompare(b.teamName);
  });

  // Assign ranks
  thirdPlaceTeams.forEach((team, index) => {
    team.rank = index + 1;
  });

  return thirdPlaceTeams;
}

/**
 * Determine if a team is eliminated based on match results
 */
export function isTeamEliminated(
  teamId: string,
  matches: Match[],
  groupStandings: Map<string, GroupStanding[]>,
  thirdPlaceRankings: ThirdPlaceRanking[]
): boolean {
  // Check if team lost a knockout match
  const knockoutMatches = matches.filter(
    (m) =>
      isKnockoutMatch(m) &&
      m.status === "FINISHED" &&
      (m.homeTeamId === teamId || m.awayTeamId === teamId)
  );

  for (const match of knockoutMatches) {
    if (match.homeScore !== null && match.awayScore !== null) {
      // Team lost knockout match (regular time or after extra time/penalties)
      if (match.homeTeamId === teamId && match.homeScore < match.awayScore) {
        return true;
      }
      if (match.awayTeamId === teamId && match.awayScore < match.homeScore) {
        return true;
      }
    }
  }

  // Check group stage elimination
  for (const [group, standings] of groupStandings) {
    const teamStanding = standings.find((s) => s.teamId === teamId);
    if (!teamStanding) continue;

    // Check if all group matches are complete (each team plays 3 matches)
    const groupMatchesComplete = standings.every((s) => s.played === 3);
    if (!groupMatchesComplete) continue;

    const position = standings.indexOf(teamStanding);

    // 4th place is eliminated
    if (position === 3) {
      return true;
    }

    // 3rd place: check if in bottom 4 of third-place teams
    if (position === 2) {
      const thirdPlaceRank = thirdPlaceRankings.find((r) => r.teamId === teamId);
      if (thirdPlaceRank && thirdPlaceRank.rank > 8) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Get elimination status for all teams in a tournament
 */
export function getEliminationStatus(matches: Match[]): Map<string, boolean> {
  const eliminationMap = new Map<string, boolean>();

  const groupStandings = calculateGroupStandings(matches);
  const thirdPlaceRankings = rankThirdPlaceTeams(groupStandings);

  // Get all unique team IDs
  const teamIds = new Set<string>();
  matches.forEach((m) => {
    teamIds.add(m.homeTeamId);
    teamIds.add(m.awayTeamId);
  });

  // Check each team
  for (const teamId of teamIds) {
    eliminationMap.set(
      teamId,
      isTeamEliminated(teamId, matches, groupStandings, thirdPlaceRankings)
    );
  }

  return eliminationMap;
}
