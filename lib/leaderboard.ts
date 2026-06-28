import { calculateGroupStandings, type Match, type GroupStanding } from "./elimination-tracker";

export interface LeaderboardParticipant {
  participantId: string;
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  teams: Array<{
    teamId: string;
    teamName: string;
    teamLogo: string | null;
    teamRanking: number | null;
    isEliminated: boolean;
    points?: number;
    goalDifference?: number;
    goalsFor?: number;
  }>;
  teamsRemaining: number;
  teamsEliminated: number;
  isFullyEliminated: boolean;
  rank: number;
}

export interface LeaderboardSection {
  stillIn: LeaderboardParticipant[];
  eliminated: LeaderboardParticipant[];
  winner: LeaderboardParticipant | null;
  runnerUp: LeaderboardParticipant | null;
}

export interface TeamStanding {
  teamId: string;
  teamName: string;
  teamLogo: string | null;
  group: string;
  position: number; // 1-4 in group
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  isEliminated: boolean;
  nextMatch?: {
    opponent: string;
    date: Date;
    isHome: boolean;
  };
}

/**
 * Calculate leaderboard from team assignments
 */
export function calculateLeaderboard(
  participants: Array<{
    participantId: string;
    userId: string;
    displayName: string | null;
    avatarUrl: string | null;
    teams: Array<{
      teamId: string;
      teamName: string;
      teamLogo: string | null;
      teamRanking: number | null;
      isEliminated: boolean;
    }>;
  }>
): LeaderboardSection {
  const leaderboardParticipants: LeaderboardParticipant[] = participants.map((p) => {
    const teamsRemaining = p.teams.filter((t) => !t.isEliminated).length;
    const teamsEliminated = p.teams.filter((t) => t.isEliminated).length;

    return {
      ...p,
      teamsRemaining,
      teamsEliminated,
      isFullyEliminated: teamsRemaining === 0,
      rank: 0, // Will be assigned after sorting
    };
  });

  // Sort by teams remaining (descending)
  leaderboardParticipants.sort((a, b) => {
    if (a.teamsRemaining !== b.teamsRemaining) {
      return b.teamsRemaining - a.teamsRemaining;
    }
    // If tied, sort alphabetically by name
    return (a.displayName || "").localeCompare(b.displayName || "");
  });

  // Assign ranks
  leaderboardParticipants.forEach((p, index) => {
    p.rank = index + 1;
  });

  // Split into sections
  const stillIn = leaderboardParticipants.filter((p) => !p.isFullyEliminated);
  const eliminated = leaderboardParticipants.filter((p) => p.isFullyEliminated);

  // Determine winner and runner-up
  let winner: LeaderboardParticipant | null = null;
  let runnerUp: LeaderboardParticipant | null = null;

  if (stillIn.length === 1) {
    winner = stillIn[0];
  } else if (
    stillIn.length === 2 &&
    stillIn[0].teamsRemaining === 1 &&
    stillIn[1].teamsRemaining === 1
  ) {
    // If exactly 2 people left with 1 team each, we're in the final
    // Winner will be determined after the final match
    winner = null;
    runnerUp = null;
  }

  // Runner-up is the first person in the eliminated section (most recent elimination)
  // But only if we have a clear winner
  if (winner && eliminated.length > 0) {
    // Find person with highest teams remaining among eliminated
    // (they were eliminated most recently in knockout stage)
    runnerUp = eliminated[0];
  }

  return {
    stillIn,
    eliminated,
    winner,
    runnerUp,
  };
}

/**
 * Get team standings with group positions
 */
export function getTeamStandings(
  matches: Match[],
  userTeams: Array<{
    teamId: string;
    teamName: string;
    teamLogo: string | null;
    isEliminated: boolean;
  }>
): TeamStanding[] {
  const groupStandings = calculateGroupStandings(matches);
  const teamStandingsMap = new Map<string, TeamStanding>();

  // Create standings for each team
  for (const [group, standings] of groupStandings) {
    standings.forEach((standing, index) => {
      const userTeam = userTeams.find((t) => t.teamId === standing.teamId);
      if (!userTeam) return;

      teamStandingsMap.set(standing.teamId, {
        teamId: standing.teamId,
        teamName: standing.teamName,
        teamLogo: userTeam.teamLogo,
        group,
        position: index + 1,
        points: standing.points,
        played: standing.played,
        won: standing.won,
        drawn: standing.drawn,
        lost: standing.lost,
        goalsFor: standing.goalsFor,
        goalsAgainst: standing.goalsAgainst,
        goalDifference: standing.goalDifference,
        isEliminated: userTeam.isEliminated,
      });
    });
  }

  // Find next matches for teams
  const upcomingMatches = matches.filter(
    (m) => (m.status === "SCHEDULED" || m.status === "TIMED")
  );

  for (const match of upcomingMatches) {
    const homeStanding = teamStandingsMap.get(match.homeTeamId);
    const awayStanding = teamStandingsMap.get(match.awayTeamId);

    if (homeStanding && !homeStanding.nextMatch) {
      homeStanding.nextMatch = {
        opponent: match.awayTeamName,
        date: new Date(match.rawData?.utcDate || Date.now()),
        isHome: true,
      };
    }

    if (awayStanding && !awayStanding.nextMatch) {
      awayStanding.nextMatch = {
        opponent: match.homeTeamName,
        date: new Date(match.rawData?.utcDate || Date.now()),
        isHome: false,
      };
    }
  }

  return Array.from(teamStandingsMap.values());
}

/**
 * Get top ranked teams for a user across all their sweepstakes
 */
export function getTopRankedTeams(
  teamStandings: TeamStanding[],
  limit: number = 3
): TeamStanding[] {
  // Filter to non-eliminated teams
  const activeTeams = teamStandings.filter((t) => !t.isEliminated);

  // Sort by group position (ascending - 1st place first)
  // then by points, then by goal difference
  activeTeams.sort((a, b) => {
    if (a.position !== b.position) return a.position - b.position;
    if (a.points !== b.points) return b.points - a.points;
    if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  return activeTeams.slice(0, limit);
}

/**
 * Get all group standings for a tournament
 */
export function getAllGroupStandings(matches: Match[]): Map<string, GroupStanding[]> {
  return calculateGroupStandings(matches);
}
