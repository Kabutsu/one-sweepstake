import Image from "next/image";

import { trpc } from "@/lib/trpc";
import { LeaderboardParticipant } from "@/lib/leaderboard";

import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import EliminationBadge from "@/components/ui/EliminationBadge";
import ProfileCircle from "@/components/ui/ProfileCircle";

import DrawTeamsButton from "./components/DrawTeamsButton";
import GroupStandingsTable from "./components/GroupStandingsTable";

interface StandingsTabProps {
  sweepstakeId: string;
  tournamentId: string;
  tournamentActive: boolean;
  drawCompletedAt: Date | null;
  isCreator: boolean;
}

export default function StandingsTab({
  sweepstakeId,
  tournamentId,
  tournamentActive,
  drawCompletedAt,
  isCreator,
}: StandingsTabProps) {
  const { data: currentUser } = trpc.auth.me.useQuery();

  const { data: leaderboard, isLoading: leaderboardLoading } =
    trpc.sweepstakes.getLeaderboard.useQuery(
      { sweepstakeId },
      {
        select: (data) => {
          // If tournament is active, return participants in rank order but sort teams by performance (remaining teams first)
          if (tournamentActive) {
            const ranked = [...data.stillIn];

            ranked.forEach((participant) => {
              participant.teams.sort((a, b) => {
                // Sort by:
                // 1. Eliminated last
                if (a.isEliminated !== b.isEliminated) {
                  return a.isEliminated ? 1 : -1;
                }

                // 2. Return original order (which is based on draw order) to avoid unnecessary reordering
                return 0;
              });
            });

            return {
              ...data,
              stillIn: ranked,
            };
          }

          // Otherwise, rank assignements with current user first, then by number of teams, then alphabetically
          const ranked = [...data.stillIn];

          ranked.sort((a: LeaderboardParticipant, b: LeaderboardParticipant) => {
            // Sort by:
            // 1. Current user first
            if (a.userId === currentUser?.id) return -1;
            if (b.userId === currentUser?.id) return 1;

            // 2. Number of remaining teams (ascending)
            const aEliminatedCount = a.teams.filter((x) => x.isEliminated).length;
            const bEliminatedCount = b.teams.filter((x) => x.isEliminated).length;
            if (aEliminatedCount !== bEliminatedCount) {
              return aEliminatedCount - bEliminatedCount;
            }

            // 3. Total number of teams (descending)
            if (a.teams.length !== b.teams.length) {
              return b.teams.length - a.teams.length;
            }

            // 4. Alphabetical by display name
            return (a.displayName || "").localeCompare(b.displayName || "");
          });

          return {
            ...data,
            stillIn: ranked,
          };
        },
      }
    );

  const { data: groupStandings, isLoading: standingsLoading } =
    trpc.sweepstakes.getGroupStandings.useQuery({ tournamentId });

  if (leaderboardLoading || standingsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Pre-draw state - show empty state with draw button
  if (!drawCompletedAt) {
    return (
      <div className="space-y-6">
        <EmptyState
          icon={
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          }
          title="No Teams Assigned Yet"
          description="Teams will be randomly assigned to participants after the draw is completed."
        />

        {isCreator && (
          <div className="flex justify-center">
            <DrawTeamsButton sweepstakeId={sweepstakeId} />
          </div>
        )}
      </div>
    );
  }

  if (!leaderboard) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p>No standings data available</p>
      </div>
    );
  }

  const { stillIn, eliminated, winner, runnerUp } = leaderboard;

  return (
    <div className="space-y-8">
      {/* Winner Announcement - only show if tournament active */}
      {tournamentActive && winner && (
        <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 dark:from-yellow-600 dark:via-yellow-700 dark:to-yellow-800 p-6 rounded-2xl text-center shadow-xl">
          <div className="text-4xl mb-2">🏆</div>
          <h2 className="text-2xl font-bold text-white mb-1">Winner!</h2>
          <p className="text-white/90 text-lg font-semibold">{winner.displayName || "Anonymous"}</p>
          <p className="text-white/75 text-sm mt-2">
            {winner.teamsRemaining} team{winner.teamsRemaining !== 1 ? "s" : ""} remaining
          </p>
        </div>
      )}

      {/* Runner-Up - only show if tournament active */}
      {tournamentActive && runnerUp && (
        <div className="bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800 p-4 rounded-xl text-center">
          <div className="text-2xl mb-1">🥈</div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Runner-Up</h3>
          <p className="text-gray-700 dark:text-gray-300 font-semibold">
            {runnerUp.displayName || "Anonymous"}
          </p>
        </div>
      )}

      {/* Team Assignments / Leaderboard */}
      <div>
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          {tournamentActive ? "Standings" : "Team Assignments"}
        </h2>

        {/* Still In Section - show differently based on tournament state */}
        {stillIn.length > 0 && (
          <div className="mb-6">
            {tournamentActive && (
              <h3 className="text-sm font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide mb-3">
                Still In ({stillIn.length})
              </h3>
            )}
            <div className="space-y-3">
              {stillIn.map((participant) => (
                <div
                  key={participant.participantId}
                  className="bg-white dark:bg-black/30 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {tournamentActive && (
                        <ProfileCircle displayName={null} showRank={participant.rank} size="lg" />
                      )}
                      <ProfileCircle
                        avatarUrl={participant.avatarUrl}
                        displayName={participant.displayName}
                        userId={participant.userId}
                        size="md"
                      />
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {participant.displayName || "Anonymous"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {participant.teamsRemaining} team
                          {participant.teamsRemaining !== 1 ? "s" : ""}
                          {tournamentActive && " remaining"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Teams */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {participant.teams.map((team) => (
                      <div
                        key={team.teamId}
                        className={`
                          flex items-center gap-2 p-2 rounded-lg
                          ${
                            team.isEliminated
                              ? "bg-gray-100 dark:bg-gray-800/50 opacity-50"
                              : tournamentActive
                                ? "bg-primary-50 dark:bg-primary-900/20"
                                : "bg-blue-50 dark:bg-blue-900/20"
                          }
                        `}
                      >
                        {team.teamLogo && (
                          <Image
                            src={team.teamLogo}
                            alt={team.teamName}
                            width={24}
                            height={24}
                            className={`w-6 h-6 object-contain ${team.isEliminated ? "grayscale" : ""}`}
                          />
                        )}
                        <span
                          className={`text-xs font-medium ${
                            team.isEliminated
                              ? "line-through text-gray-500"
                              : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {team.teamName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Eliminated Section - only show if tournament active */}
        {tournamentActive && eliminated.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide mb-3">
              Eliminated ({eliminated.length})
            </h3>
            <div className="space-y-3 opacity-60">
              {eliminated.map((participant) => (
                <div
                  key={participant.participantId}
                  className="bg-white dark:bg-black/30 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <ProfileCircle
                        avatarUrl={participant.avatarUrl}
                        displayName={participant.displayName}
                        userId={participant.userId}
                        size="lg"
                        grayscale={true}
                      />
                      <div>
                        <p className="font-semibold text-gray-700 dark:text-gray-300">
                          {participant.displayName || "Anonymous"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          All teams eliminated
                        </p>
                      </div>
                    </div>
                    <EliminationBadge isEliminated={true} size="sm" />
                  </div>

                  {/* Teams */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {participant.teams.map((team) => (
                      <div
                        key={team.teamId}
                        className="flex items-center gap-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-800/50"
                      >
                        {team.teamLogo && (
                          <Image
                            src={team.teamLogo}
                            alt={team.teamName}
                            width={24}
                            height={24}
                            className="w-6 h-6 object-contain grayscale"
                          />
                        )}
                        <span className="text-xs font-medium line-through text-gray-500">
                          {team.teamName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Group Standings */}
      <div>
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Group Standings</h2>
        {groupStandings ? (
          <GroupStandingsTable standings={groupStandings} />
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>Group standings not available</p>
          </div>
        )}
      </div>
    </div>
  );
}
