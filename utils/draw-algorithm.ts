import { TeamSeeding, SeedingConfig } from "../scripts/seed-tournament";

export interface Participant {
  id: string;
  userId: string;
  displayName: string | null;
}

export interface TeamAssignment {
  participantId: string;
  teamId: string;
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Generate pots based on team rankings and number of participants
 */
function generatePots(teams: TeamSeeding[], participantCount: number): TeamSeeding[][] {
  // Sort teams by ranking (already sorted in seeding config, but ensure it)
  const sortedTeams = [...teams].sort((a, b) => (a.ranking || 0) - (b.ranking || 0));

  // Calculate number of pots
  const totalTeams = sortedTeams.length;
  const numPots = Math.ceil(totalTeams / participantCount);

  // Split teams into pots
  const pots: TeamSeeding[][] = [];
  const teamsPerPot = Math.ceil(totalTeams / numPots);

  for (let i = 0; i < numPots; i++) {
    const start = i * teamsPerPot;
    const end = Math.min(start + teamsPerPot, totalTeams);
    pots.push(sortedTeams.slice(start, end));
  }

  // Shuffle teams within each pot for fairness
  return pots.map((pot) => shuffleArray(pot));
}

/**
 * Generate ABBA snake draft order
 * For n participants and r rounds:
 * Round 1: A, B, C, D
 * Round 2: D, C, B, A
 * Round 3: A, B, C, D
 * Round 4: D, C, B, A
 */
function generateABBAOrder(participantCount: number, rounds: number): number[] {
  const order: number[] = [];

  for (let round = 0; round < rounds; round++) {
    if (round % 2 === 0) {
      // Forward order (A -> D)
      for (let i = 0; i < participantCount; i++) {
        order.push(i);
      }
    } else {
      // Reverse order (D -> A)
      for (let i = participantCount - 1; i >= 0; i--) {
        order.push(i);
      }
    }
  }

  return order;
}

/**
 * Execute the team draw using ABBA snake draft
 */
export function executeTeamDraw(
  participants: Participant[],
  seedingConfig: SeedingConfig
): TeamAssignment[] {
  if (participants.length === 0) {
    throw new Error("No participants to assign teams to");
  }

  if (!seedingConfig.teams || seedingConfig.teams.length === 0) {
    throw new Error("No teams available in seeding configuration");
  }

  // Randomize participant order
  const randomizedParticipants = shuffleArray(participants);
  const participantCount = randomizedParticipants.length;
  const totalTeams = seedingConfig.teams.length;

  // Calculate teams per participant
  const baseTeams = Math.floor(totalTeams / participantCount);
  const remainder = totalTeams % participantCount;

  // Generate pots
  const pots = generatePots(seedingConfig.teams, participantCount);

  // Calculate total rounds needed
  // Some participants get baseTeams + 1, others get baseTeams
  const maxTeamsPerParticipant = baseTeams + (remainder > 0 ? 1 : 0);
  const numRounds = maxTeamsPerParticipant;

  // Generate ABBA draft order
  const draftOrder = generateABBAOrder(participantCount, numRounds);

  // Track team assignments
  const assignments: TeamAssignment[] = [];
  const participantTeamCounts = new Array(participantCount).fill(0);

  // Execute draft
  let currentPotIndex = 0;
  let currentPot = [...pots[currentPotIndex]];

  for (const participantIndex of draftOrder) {
    const participant = randomizedParticipants[participantIndex];

    // Check if this participant has reached their max teams
    const currentCount = participantTeamCounts[participantIndex];
    const maxTeams = participantIndex < remainder ? baseTeams + 1 : baseTeams;

    if (currentCount >= maxTeams) {
      continue;
    }

    // If current pot is empty, move to next pot
    while (currentPot.length === 0 && currentPotIndex < pots.length - 1) {
      currentPotIndex++;
      currentPot = [...pots[currentPotIndex]];
    }

    // Pick a team from current pot
    if (currentPot.length > 0) {
      const team = currentPot.pop()!;

      assignments.push({
        participantId: participant.id,
        teamId: team.id || team.tla, // Use ID if available, otherwise TLA
      });

      participantTeamCounts[participantIndex]++;
    }
  }

  return assignments;
}

/**
 * Validate that all teams have been assigned
 */
export function validateTeamAssignments(
  assignments: TeamAssignment[],
  totalTeams: number
): boolean {
  return assignments.length === totalTeams;
}

/**
 * Get team assignments grouped by participant
 */
export function groupAssignmentsByParticipant(
  assignments: TeamAssignment[]
): Map<string, TeamAssignment[]> {
  const grouped = new Map<string, TeamAssignment[]>();

  for (const assignment of assignments) {
    const existing = grouped.get(assignment.participantId) || [];
    existing.push(assignment);
    grouped.set(assignment.participantId, existing);
  }

  return grouped;
}
