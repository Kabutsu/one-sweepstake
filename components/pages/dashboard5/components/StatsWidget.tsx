import { MockSweepstake } from "@/mocks/dashboardData";

interface StatsWidgetProps {
  sweepstakes: MockSweepstake[];
}

export default function StatsWidget({ sweepstakes }: StatsWidgetProps) {
  const activeSweepstakes = sweepstakes.filter((s) => s.drawCompletedAt !== null).length;
  const pendingSweepstakes = sweepstakes.length - activeSweepstakes;
  const totalParticipants = sweepstakes.reduce((sum, s) => sum + s.currentParticipants, 0);

  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="border-b border-gray-200 dark:border-gray-800 p-4">
        <h2 className="font-bold text-sm uppercase tracking-wide">Statistics</h2>
      </div>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/10 to-transparent rounded-lg">
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Sweepstakes</div>
            <div className="text-2xl font-black text-primary">{sweepstakes.length}</div>
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Active</div>
            <div className="text-xl font-bold">{activeSweepstakes}</div>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Pending</div>
            <div className="text-xl font-bold">{pendingSweepstakes}</div>
          </div>
        </div>

        <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Players</div>
          <div className="text-xl font-bold">{totalParticipants}</div>
        </div>

        <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
            <div className="flex items-center justify-between">
              <span>Tournament</span>
              <span className="font-semibold">World Cup 2026</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Status</span>
              <span className="font-semibold text-primary">Upcoming</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
