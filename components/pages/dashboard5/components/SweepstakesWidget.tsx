import { MockSweepstake } from "@/mocks/dashboardData";

interface SweepstakesWidgetProps {
  sweepstakes: MockSweepstake[];
}

export default function SweepstakesWidget({ sweepstakes }: SweepstakesWidgetProps) {
  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="border-b border-gray-200 dark:border-gray-800 p-4">
        <h2 className="font-bold text-sm uppercase tracking-wide">Your Sweepstakes</h2>
      </div>
      {sweepstakes.length === 0 ? (
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">No sweepstakes yet</p>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          {sweepstakes.map((sweepstake) => {
            const isDrawComplete = sweepstake.drawCompletedAt !== null;
            const fillPercentage = (sweepstake.currentParticipants / sweepstake.maxParticipants) * 100;

            return (
              <div
                key={sweepstake.id}
                className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold mb-1 group-hover:text-primary transition-colors">
                      {sweepstake.name}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {sweepstake.tournamentName}
                    </p>
                  </div>
                  {isDrawComplete ? (
                    <span className="flex-shrink-0 bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded">
                      ACTIVE
                    </span>
                  ) : (
                    <span className="flex-shrink-0 bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200 text-xs font-bold px-2 py-1 rounded">
                      PENDING
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
                  <span>Participants</span>
                  <span className="font-semibold">
                    {sweepstake.currentParticipants} / {sweepstake.maxParticipants}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${fillPercentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
