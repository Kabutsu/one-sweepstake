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
  tournamentRanking?: number;
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
 * Determine penalty shootout winner from match rawData
 * Returns the team ID of the winner, or null if no penalty data available
 */
function getPenaltyWinner(match: Match): string | null {
  // Check API-Football format first (in apiFootball nested object)
  if (match.rawData?.apiFootball?.score?.penalty) {
    const penaltyScore = match.rawData.apiFootball.score.penalty;
    if (penaltyScore.home !== null && penaltyScore.away !== null) {
      if (penaltyScore.home > penaltyScore.away) {
        return match.homeTeamId;
      } else if (penaltyScore.away > penaltyScore.home) {
        return match.awayTeamId;
      }
    }
  }

  // Check football-data.org format (if they provide penalty scores)
  if (match.rawData?.score?.penalties) {
    const penaltyScore = match.rawData.score.penalties;
    if (penaltyScore.home !== null && penaltyScore.away !== null) {
      if (penaltyScore.home > penaltyScore.away) {
        return match.homeTeamId;
      } else if (penaltyScore.away > penaltyScore.home) {
        return match.awayTeamId;
      }
    }
  }

  // Check if winner is indicated in the match data
  if (match.rawData?.apiFootball?.teams) {
    if (match.rawData.apiFootball.teams.home.winner === true) {
      return match.homeTeamId;
    } else if (match.rawData.apiFootball.teams.away.winner === true) {
      return match.awayTeamId;
    }
  }

  return null;
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

  // Process each match to build raw standings
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

  // Sort each group's standings with head-to-head tiebreakers
  const sortedStandings = new Map<string, GroupStanding[]>();

  for (const [group, standings] of standingsMap) {
    const standingsArray = Array.from(standings.values());
    const sorted = sortStandingsWithHeadToHead(standingsArray, groupMatches);
    sortedStandings.set(group, sorted);
  }

  return sortedStandings;
}

/**
 * Sort standings with FIFA head-to-head tiebreaker rules
 */
function sortStandingsWithHeadToHead(
  standings: GroupStanding[],
  groupMatches: Match[]
): GroupStanding[] {
  // Group teams by points
  const pointGroups = new Map<number, GroupStanding[]>();
  for (const standing of standings) {
    const points = standing.points;
    if (!pointGroups.has(points)) {
      pointGroups.set(points, []);
    }
    pointGroups.get(points)!.push(standing);
  }

  // Sort each point group
  const sortedStandings: GroupStanding[] = [];
  const sortedPoints = Array.from(pointGroups.keys()).sort((a, b) => b - a);

  for (const points of sortedPoints) {
    const teamsWithSamePoints = pointGroups.get(points)!;

    if (teamsWithSamePoints.length === 1) {
      // Only one team with this point total, no tiebreaker needed
      sortedStandings.push(teamsWithSamePoints[0]);
    } else {
      // Multiple teams tied on points, apply head-to-head
      const resolvedTeams = resolveHeadToHeadTiebreaker(teamsWithSamePoints, groupMatches);
      sortedStandings.push(...resolvedTeams);
    }
  }

  return sortedStandings;
}

/**
 * Resolve tiebreaker for teams with same points using head-to-head records
 */
function resolveHeadToHeadTiebreaker(
  tiedTeams: GroupStanding[],
  groupMatches: Match[]
): GroupStanding[] {
  if (tiedTeams.length === 1) {
    return tiedTeams;
  }

  const teamIds = new Set(tiedTeams.map((t) => t.teamId));

  // Extract head-to-head matches (matches only between these teams)
  const h2hMatches = groupMatches.filter(
    (m) =>
      teamIds.has(m.homeTeamId) &&
      teamIds.has(m.awayTeamId) &&
      m.homeScore !== null &&
      m.awayScore !== null
  );

  // Calculate head-to-head standings
  const h2hStandings = new Map<string, GroupStanding>();
  for (const team of tiedTeams) {
    h2hStandings.set(team.teamId, {
      ...team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    });
  }

  // Process head-to-head matches
  for (const match of h2hMatches) {
    const homeTeam = h2hStandings.get(match.homeTeamId)!;
    const awayTeam = h2hStandings.get(match.awayTeamId)!;

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

  // Sort by head-to-head tiebreakers, then group-level tiebreakers
  const h2hArray = Array.from(h2hStandings.values());
  h2hArray.sort((a, b) => {
    // 1. Head-to-head points
    if (a.points !== b.points) return b.points - a.points;
    // 2. Head-to-head goal difference
    if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference;
    // 3. Head-to-head goals scored
    if (a.goalsFor !== b.goalsFor) return b.goalsFor - a.goalsFor;

    // Get original group-level stats for remaining tiebreakers
    const aOriginal = tiedTeams.find((t) => t.teamId === a.teamId)!;
    const bOriginal = tiedTeams.find((t) => t.teamId === b.teamId)!;

    // 4. Group goal difference
    if (aOriginal.goalDifference !== bOriginal.goalDifference)
      return bOriginal.goalDifference - aOriginal.goalDifference;
    // 5. Group goals scored
    if (aOriginal.goalsFor !== bOriginal.goalsFor) return bOriginal.goalsFor - aOriginal.goalsFor;
    // 6. Fair play (skipped - no data available)
    // 7. Tournament ranking (if available)
    if (aOriginal.tournamentRanking && bOriginal.tournamentRanking) {
      return aOriginal.tournamentRanking - bOriginal.tournamentRanking;
    }
    // 8. Alphabetical as final fallback
    return a.teamName.localeCompare(b.teamName);
  });

  // Map back to original team objects with group-level stats
  return h2hArray.map((h2h) => tiedTeams.find((t) => t.teamId === h2h.teamId)!);
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
  thirdPlaceRankings: ThirdPlaceRanking[],
  teamRankings: Map<string, number> = new Map()
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
      // Check regular/extra time scores first
      if (match.homeTeamId === teamId && match.homeScore < match.awayScore) {
        return true;
      }
      if (match.awayTeamId === teamId && match.awayScore < match.homeScore) {
        return true;
      }

      // Handle penalty shootouts when scores are tied
      if (match.homeScore === match.awayScore) {
        const penaltyWinner = getPenaltyWinner(match);
        if (penaltyWinner) {
          // Team lost on penalties
          if (match.homeTeamId === teamId && penaltyWinner === match.awayTeamId) {
            return true;
          }
          if (match.awayTeamId === teamId && penaltyWinner === match.homeTeamId) {
            return true;
          }
        }
      }
    }
  }

  // Check group stage elimination (including early elimination)
  const allGroupStageMatches = matches.filter(isGroupStageMatch);
  const teamGroupMatches = allGroupStageMatches.filter(
    (m) => m.homeTeamId === teamId || m.awayTeamId === teamId
  );

  if (teamGroupMatches.length > 0) {
    const group = getGroupFromMatch(teamGroupMatches[0]);

    if (group) {
      const groupMatches = allGroupStageMatches.filter((m) => getGroupFromMatch(m) === group);

      const isFinished = (m: Match) =>
        m.status === "FINISHED" && m.homeScore !== null && m.awayScore !== null;

      // Count this team's fixtures (played + scheduled). Each team plays 3 group
      // matches. Only attempt early elimination if we have the full fixture list,
      // otherwise we lack the information to simulate remaining matches and must
      // stay conservative to avoid false eliminations.
      const teamFixtures = groupMatches.filter(
        (m) => m.homeTeamId === teamId || m.awayTeamId === teamId
      );
      const hasFullFixtures = teamFixtures.length >= 3;

      if (hasFullFixtures) {
        // Simulate every remaining outcome to find the best position this team can
        // still finish in. A 4th-place finish can never advance (not even as a best
        // third-placed team), so if the team can never escape 4th, it is eliminated.
        const bestPosition = getBestAchievablePosition(teamId, groupMatches, group, teamRankings);

        if (bestPosition >= 4) {
          return true;
        }

        // If the group is fully played, apply exact final-position rules
        const groupComplete = groupMatches.every(isFinished);

        if (groupComplete) {
          const standings = groupStandings.get(group);
          const teamStanding = standings?.find((s) => s.teamId === teamId);

          if (standings && teamStanding) {
            const position = standings.indexOf(teamStanding);

            // 4th place is eliminated
            if (position === 3) {
              return true;
            }

            // 3rd place: eliminated if outside the best 8 third-placed teams
            if (position === 2) {
              const thirdPlaceRank = thirdPlaceRankings.find((r) => r.teamId === teamId);
              if (thirdPlaceRank && thirdPlaceRank.rank > 8) {
                return true;
              }
            }
          }
        }
      }
    }
  }

  return false;
}

/**
 * Enumerate all possible win/draw/loss outcome combinations for n matches.
 * Each outcome is represented as 0 (home win), 1 (draw), or 2 (away win).
 */
function enumerateOutcomes(n: number): number[][] {
  if (n === 0) return [[]];

  const result: number[][] = [];
  const total = Math.pow(3, n);

  for (let i = 0; i < total; i++) {
    const combination: number[] = [];
    let value = i;
    for (let j = 0; j < n; j++) {
      combination.push(value % 3);
      value = Math.floor(value / 3);
    }
    result.push(combination);
  }

  return result;
}

/**
 * Build sorted group standings from a complete set of scored matches.
 * Initializes all known teams so that teams without results still appear.
 */
function buildSortedStandings(
  teamInfos: Map<string, string>,
  scoredMatches: Match[],
  group: string,
  teamRankings: Map<string, number>
): GroupStanding[] {
  const standings = new Map<string, GroupStanding>();

  for (const [teamId, teamName] of teamInfos) {
    standings.set(teamId, {
      teamId,
      teamName,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      group,
      tournamentRanking: teamRankings.get(teamId),
    });
  }

  for (const match of scoredMatches) {
    if (match.homeScore === null || match.awayScore === null) continue;

    const homeTeam = standings.get(match.homeTeamId);
    const awayTeam = standings.get(match.awayTeamId);
    if (!homeTeam || !awayTeam) continue;

    homeTeam.played++;
    awayTeam.played++;

    homeTeam.goalsFor += match.homeScore;
    homeTeam.goalsAgainst += match.awayScore;
    awayTeam.goalsFor += match.awayScore;
    awayTeam.goalsAgainst += match.homeScore;

    if (match.homeScore > match.awayScore) {
      homeTeam.won++;
      homeTeam.points += 3;
      awayTeam.lost++;
    } else if (match.homeScore < match.awayScore) {
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

  return sortStandingsWithHeadToHead(Array.from(standings.values()), scoredMatches);
}

/**
 * Determine the best final group position a team can still achieve by simulating
 * all remaining match outcomes. The evaluated team is given maximal results
 * (large wins) in its own remaining matches, while all other remaining matches
 * are enumerated across every win/draw/loss combination. The lowest (best)
 * position reached across all scenarios is returned.
 */
function getBestAchievablePosition(
  teamId: string,
  groupMatches: Match[],
  group: string,
  teamRankings: Map<string, number>
): number {
  // Collect all teams in the group
  const teamInfos = new Map<string, string>();
  for (const match of groupMatches) {
    teamInfos.set(match.homeTeamId, match.homeTeamName);
    teamInfos.set(match.awayTeamId, match.awayTeamName);
  }

  const isFinished = (m: Match) =>
    m.status === "FINISHED" && m.homeScore !== null && m.awayScore !== null;

  const finished = groupMatches.filter(isFinished);
  const remaining = groupMatches.filter((m) => !isFinished(m));

  // Force the evaluated team's remaining matches to large wins (best case for it)
  const teamRemaining = remaining.filter((m) => m.homeTeamId === teamId || m.awayTeamId === teamId);
  const otherRemaining = remaining.filter(
    (m) => m.homeTeamId !== teamId && m.awayTeamId !== teamId
  );

  const teamWins: Match[] = teamRemaining.map((m) => ({
    ...m,
    status: "FINISHED",
    homeScore: m.homeTeamId === teamId ? 9 : 0,
    awayScore: m.awayTeamId === teamId ? 9 : 0,
  }));

  // Enumerate all win/draw/loss combinations for the other remaining matches
  const scenarios = enumerateOutcomes(otherRemaining.length);
  let bestPosition = teamInfos.size; // worst possible (last place)

  for (const scenario of scenarios) {
    const simulatedOthers: Match[] = otherRemaining.map((m, i) => {
      const outcome = scenario[i];
      const homeScore = outcome === 0 ? 1 : 0;
      const awayScore = outcome === 2 ? 1 : 0;
      return { ...m, status: "FINISHED", homeScore, awayScore };
    });

    const scoredMatches = [...finished, ...teamWins, ...simulatedOthers];
    const standings = buildSortedStandings(teamInfos, scoredMatches, group, teamRankings);
    const position = standings.findIndex((s) => s.teamId === teamId) + 1;

    if (position >= 1 && position < bestPosition) {
      bestPosition = position;
    }

    // Can't do better than 1st place
    if (bestPosition === 1) break;
  }

  return bestPosition;
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

/**
 * Calculate elimination status with tournament rankings included
 * Returns a map of teamId -> isEliminated
 */
export function calculateEliminationWithRankings(
  matches: Match[],
  teamRankings: Map<string, number>
): Map<string, boolean> {
  const groupMatches = matches.filter(
    (m) =>
      isGroupStageMatch(m) &&
      m.status === "FINISHED" &&
      m.homeScore !== null &&
      m.awayScore !== null
  );

  // Build standings with rankings
  const standingsMap = new Map<string, Map<string, GroupStanding>>();

  for (const match of groupMatches) {
    const group = getGroupFromMatch(match);
    if (!group) continue;

    if (!standingsMap.has(group)) {
      standingsMap.set(group, new Map());
    }

    const groupStandings = standingsMap.get(group)!;

    // Initialize teams with rankings
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
        tournamentRanking: teamRankings.get(match.homeTeamId),
      });
    }

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
        tournamentRanking: teamRankings.get(match.awayTeamId),
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

  // Sort standings with head-to-head
  const sortedStandings = new Map<string, GroupStanding[]>();
  for (const [group, standings] of standingsMap) {
    const standingsArray = Array.from(standings.values());
    const sorted = sortStandingsWithHeadToHead(standingsArray, groupMatches);
    sortedStandings.set(group, sorted);
  }

  const thirdPlaceRankings = rankThirdPlaceTeams(sortedStandings);

  // Calculate elimination for all teams
  const eliminationMap = new Map<string, boolean>();
  const teamIds = new Set<string>();
  matches.forEach((m) => {
    teamIds.add(m.homeTeamId);
    teamIds.add(m.awayTeamId);
  });

  for (const teamId of teamIds) {
    eliminationMap.set(
      teamId,
      isTeamEliminated(teamId, matches, sortedStandings, thirdPlaceRankings, teamRankings)
    );
  }

  return eliminationMap;
}
