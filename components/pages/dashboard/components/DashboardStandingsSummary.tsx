import { trpc } from "@/lib/trpc";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function DashboardStandingsSummary() {
  const { data: summary, isLoading } = trpc.sweepstakes.getDashboardSummary.useQuery();

  if (isLoading) {
    return (
      <div className="glass p-6 rounded-2xl shadow-xl mb-6 flex items-center justify-center">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (!summary || summary.activeSweepstakes === 0) {
    return null; // Don't show anything if no active sweepstakes
  }

  const { totalTeamsRemaining, topTeams } = summary;

  if (totalTeamsRemaining === 0) {
    return (
      <div className="glass p-6 rounded-2xl shadow-xl mb-6 border border-red-200 dark:border-red-800">
        <div className="text-center">
          <div className="text-4xl mb-3">😢</div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            All Teams Eliminated
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Better luck next time! Keep following along to see who takes the crown.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass p-6 rounded-2xl shadow-xl mb-6 border border-green-200 dark:border-green-800">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Your Active Teams</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {totalTeamsRemaining} team{totalTeamsRemaining !== 1 ? "s" : ""} still in contention
          </p>
        </div>
      </div>

      {topTeams && topTeams.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Top Performers
          </p>
          {topTeams.map((team, index) => (
            <div
              key={team.teamId}
              className="bg-white/50 dark:bg-black/30 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {team.teamLogo && (
                      <img
                        src={team.teamLogo}
                        alt={team.teamName}
                        className="w-8 h-8 object-contain"
                      />
                    )}
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">
                        {team.teamName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Group {team.group} • #{team.position}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{team.points}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">pts</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                <span>
                  {team.won}W {team.drawn}D {team.lost}L
                </span>
                <span
                  className={
                    team.goalDifference >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }
                >
                  {team.goalDifference > 0 ? "+" : ""}
                  {team.goalDifference} GD
                </span>
              </div>

              {/* Next Match */}
              {team.nextMatch && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Next:</span> {team.nextMatch.isHome ? "vs" : "@"}{" "}
                    {team.nextMatch.opponent}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {new Date(team.nextMatch.date).toLocaleDateString("en-GB", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
