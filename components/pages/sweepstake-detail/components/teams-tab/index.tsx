import { trpc } from "@/lib/trpc";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EliminationBadge from "@/components/ui/EliminationBadge";
import DrawTeamsButton from "./components/DrawTeamsButton";
import { getInitials } from "@/utils/user-utils";

interface TeamsTabProps {
  sweepstakeId: string;
  drawCompletedAt: Date | null;
  isCreator: boolean;
}

interface Team {
  teamId: string;
  teamName: string;
  teamLogo: string | null;
  isEliminated: boolean;
}

interface TeamAssignment {
  participantId: string;
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  teams: Team[];
}

export default function TeamsTab({ sweepstakeId, drawCompletedAt, isCreator }: TeamsTabProps) {
  const { data: currentUser } = trpc.auth.me.useQuery();

  const {
    data: teamAssignments,
    isLoading,
    error,
  } = trpc.sweepstakes.getTeamAssignments.useQuery(
    { sweepstakeId },
    {
      enabled: !!drawCompletedAt,
      select: (data) => {
        return data.sort((a: TeamAssignment, b: TeamAssignment) => {
          // Sort by:
          // 1. Current user first
          if (a.userId === currentUser?.id) return -1;
          if (b.userId === currentUser?.id) return 1;

          // 2. Number of remaining teams (ascending)
          const aEliminatedCount = a.teams.filter(x => x.isEliminated).length;
          const bEliminatedCount = b.teams.filter(x => x.isEliminated).length;
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
      },
    }
  );

  // Show loading state while fetching
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If draw not completed yet
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

  // Show error state
  if (error || !teamAssignments) {
    return (
      <EmptyState
        icon={
          <svg
            className="w-12 h-12 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        }
        title="Error Loading Teams"
        description={error?.message || "Failed to load team assignments"}
      />
    );
  }

  // Display team assignments
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Team Assignments</h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {teamAssignments.length} Participants
        </span>
      </div>

      {/* Team Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teamAssignments.map((assignment: TeamAssignment) => {
          const allTeamsEliminated = assignment.teams.every((t) => t.isEliminated);
          const hasEliminatedTeam = assignment.teams.some((t) => t.isEliminated);

          return (
            <div
              key={assignment.participantId}
              className={`
                bg-white dark:bg-black/50 backdrop-blur-lg p-4 rounded-xl
                border border-gray-200/50 dark:border-gray-700/50
                hover:shadow-lg transition-all duration-200
                ${allTeamsEliminated ? "opacity-60" : ""}
              `}
            >
              {/* Participant Header */}
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  {assignment.avatarUrl ? (
                    <img
                      src={assignment.avatarUrl}
                      alt={assignment.displayName || "User"}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold">
                      {getInitials(assignment.displayName || "🥸")}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">
                    {assignment.displayName || "Unknown User"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {assignment.teams.length} {assignment.teams.length === 1 ? "Team" : "Teams"}
                    {hasEliminatedTeam && (
                      <span className="ml-1">
                        • {assignment.teams.filter((t) => !t.isEliminated).length} left
                      </span>
                    )}
                  </p>
                </div>
                {allTeamsEliminated && <EliminationBadge isEliminated={true} size="sm" />}
              </div>

              {/* Teams List */}
              <div className="space-y-2">
                {assignment.teams.map((team) => (
                  <div
                    key={team.teamId}
                    className={`
                      flex items-center gap-3 p-2 rounded-lg
                      bg-gray-50 dark:bg-gray-800/50
                      hover:bg-gray-100 dark:hover:bg-gray-800
                      transition-colors
                      ${team.isEliminated ? "opacity-50" : ""}
                    `}
                  >
                    {team.teamLogo ? (
                      <img
                        src={team.teamLogo}
                        alt={team.teamName}
                        className={`w-8 h-8 object-contain ${team.isEliminated ? "grayscale" : ""}`}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-gray-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                          />
                        </svg>
                      </div>
                    )}
                    <span
                      className={`
                        text-sm font-medium text-gray-900 dark:text-white truncate flex-1
                        ${team.isEliminated ? "line-through" : ""}
                      `}
                    >
                      {team.teamName}
                    </span>
                    {team.isEliminated && (
                      <EliminationBadge isEliminated={true} variant="inline" size="sm" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
