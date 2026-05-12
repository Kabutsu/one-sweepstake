import { trpc } from "@/lib/trpc";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EliminationBadge from "@/components/ui/EliminationBadge";
import GroupStandingsTable from "./GroupStandingsTable";
import { getInitials } from "@/utils/user-utils";

interface LeaderboardTabProps {
  sweepstakeId: string;
  tournamentId: string;
}

export default function LeaderboardTab({ sweepstakeId, tournamentId }: LeaderboardTabProps) {
  const { data: leaderboard, isLoading: leaderboardLoading } =
    trpc.sweepstakes.getLeaderboard.useQuery({ sweepstakeId });

  const { data: groupStandings, isLoading: standingsLoading } =
    trpc.sweepstakes.getGroupStandings.useQuery({ tournamentId });

  if (leaderboardLoading || standingsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!leaderboard) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p>No leaderboard data available</p>
      </div>
    );
  }

  const { stillIn, eliminated, winner, runnerUp } = leaderboard;

  return (
    <div className="space-y-8">
      {/* Winner Announcement */}
      {winner && (
        <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 dark:from-yellow-600 dark:via-yellow-700 dark:to-yellow-800 p-6 rounded-2xl text-center shadow-xl">
          <div className="text-4xl mb-2">🏆</div>
          <h2 className="text-2xl font-bold text-white mb-1">Winner!</h2>
          <p className="text-white/90 text-lg font-semibold">{winner.displayName || "Anonymous"}</p>
          <p className="text-white/75 text-sm mt-2">
            {winner.teamsRemaining} team{winner.teamsRemaining !== 1 ? "s" : ""} remaining
          </p>
        </div>
      )}

      {/* Runner-Up */}
      {runnerUp && (
        <div className="bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800 p-4 rounded-xl text-center">
          <div className="text-2xl mb-1">🥈</div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Runner-Up</h3>
          <p className="text-gray-700 dark:text-gray-300 font-semibold">
            {runnerUp.displayName || "Anonymous"}
          </p>
        </div>
      )}

      {/* Leaderboard */}
      <div>
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Leaderboard</h2>

        {/* Still In Section */}
        {stillIn.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide mb-3">
              Still In ({stillIn.length})
            </h3>
            <div className="space-y-3">
              {stillIn.map((participant) => (
                <div
                  key={participant.participantId}
                  className="bg-white dark:bg-black/30 rounded-xl border-2 border-green-200 dark:border-green-800 p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-sm">
                        #{participant.rank}
                      </div>
                      {participant.avatarUrl ? (
                        <img
                          src={participant.avatarUrl}
                          alt={participant.displayName || "User"}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold">
                          {getInitials(participant.displayName || "🥸")}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {participant.displayName || "Anonymous"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {participant.teamsRemaining} team
                          {participant.teamsRemaining !== 1 ? "s" : ""} remaining
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
                          ${team.isEliminated ? "bg-gray-100 dark:bg-gray-800/50 opacity-50" : "bg-green-50 dark:bg-green-900/20"}
                        `}
                      >
                        {team.teamLogo && (
                          <img
                            src={team.teamLogo}
                            alt={team.teamName}
                            className={`w-6 h-6 object-contain ${team.isEliminated ? "grayscale" : ""}`}
                          />
                        )}
                        <span
                          className={`text-xs font-medium ${team.isEliminated ? "line-through text-gray-500" : "text-gray-900 dark:text-white"}`}
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

        {/* Eliminated Section */}
        {eliminated.length > 0 && (
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
                      {participant.avatarUrl ? (
                        <img
                          src={participant.avatarUrl}
                          alt={participant.displayName || "User"}
                          className="w-10 h-10 rounded-full grayscale"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white font-semibold">
                          {getInitials(participant.displayName || "🥸")}
                        </div>
                      )}
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
                          <img
                            src={team.teamLogo}
                            alt={team.teamName}
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
