export interface MockSweepstake {
  id: string;
  name: string;
  tournamentName: string;
  maxParticipants: number;
  currentParticipants: number;
  drawCompletedAt: Date | null;
  creatorId: string;
  joinCode: string;
  createdAt: Date;
}

export interface MockLiveMatch {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: "IN_PLAY" | "PAUSED";
  minute: number;
}

export const mockSweepstakes: MockSweepstake[] = [
  {
    id: "1",
    name: "Office World Cup 2026",
    tournamentName: "FIFA World Cup 2026",
    maxParticipants: 48,
    currentParticipants: 24,
    drawCompletedAt: new Date("2026-05-01"),
    creatorId: "user1",
    joinCode: "ABC123",
    createdAt: new Date("2026-04-15"),
  },
  {
    id: "2",
    name: "Friends & Family",
    tournamentName: "FIFA World Cup 2026",
    maxParticipants: 20,
    currentParticipants: 18,
    drawCompletedAt: new Date("2026-05-03"),
    creatorId: "user2",
    joinCode: "XYZ789",
    createdAt: new Date("2026-04-20"),
  },
  {
    id: "3",
    name: "University Alumni",
    tournamentName: "FIFA World Cup 2026",
    maxParticipants: 32,
    currentParticipants: 30,
    drawCompletedAt: new Date("2026-05-05"),
    creatorId: "user1",
    joinCode: "UNI456",
    createdAt: new Date("2026-04-25"),
  },
  {
    id: "4",
    name: "Local Pub League",
    tournamentName: "FIFA World Cup 2026",
    maxParticipants: 16,
    currentParticipants: 16,
    drawCompletedAt: null,
    creatorId: "user3",
    joinCode: "PUB999",
    createdAt: new Date("2026-05-07"),
  },
];

export const mockLiveMatches: MockLiveMatch[] = [
  {
    homeTeam: "England",
    awayTeam: "Brazil",
    homeScore: 1,
    awayScore: 2,
    status: "IN_PLAY",
    minute: 67,
  },
  {
    homeTeam: "Argentina",
    awayTeam: "France",
    homeScore: 0,
    awayScore: 0,
    status: "PAUSED",
    minute: 45,
  },
];
