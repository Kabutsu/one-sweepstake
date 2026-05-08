import { MockSweepstake } from "@/mocks/dashboardData";

interface SweepstakeListProps {
  sweepstakes: MockSweepstake[];
}

export default function SweepstakeList({ sweepstakes }: SweepstakeListProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Your Sweepstakes ({sweepstakes.length})
      </h3>
      <div className="space-y-2">
        {sweepstakes.map((sweepstake) => {
          const isDrawComplete = sweepstake.drawCompletedAt !== null;
          return (
            <div
              key={sweepstake.id}
              className="card p-4 hover:border-primary/30 transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-bold text-base group-hover:text-primary transition-colors truncate">
                      {sweepstake.name}
                    </h4>
                    {isDrawComplete ? (
                      <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full"></span>
                    ) : (
                      <span className="flex-shrink-0 w-2 h-2 bg-yellow-500 rounded-full"></span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 mt-1 text-xs text-gray-600 dark:text-gray-400">
                    <span>
                      {sweepstake.currentParticipants}/{sweepstake.maxParticipants} players
                    </span>
                    <span>•</span>
                    <span>{isDrawComplete ? "Active" : "Waiting for draw"}</span>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <svg
                    className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
