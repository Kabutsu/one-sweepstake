import { MockSweepstake } from "@/mocks/dashboardData";

interface StatsSidebarProps {
  sweepstakes: MockSweepstake[];
}

export default function StatsSidebar({ sweepstakes }: StatsSidebarProps) {
  const activeSweepstakes = sweepstakes.filter((s) => s.drawCompletedAt !== null).length;
  const totalParticipants = sweepstakes.reduce((sum, s) => sum + s.currentParticipants, 0);

  return (
    <div className="sticky top-6 space-y-4">
      <div className="card p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-4">
          Overview
        </h3>
        <div className="space-y-4">
          <div>
            <div className="text-3xl font-bold text-primary mb-1">{sweepstakes.length}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Total Sweepstakes</div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-1">{activeSweepstakes}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Active Draws</div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-1">{totalParticipants}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Total Players</div>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-4">
          Quick Actions
        </h3>
        <div className="space-y-2">
          <button className="w-full btn-primary text-sm py-2">Create Sweepstake</button>
          <button className="w-full btn-secondary text-sm py-2">Join with Code</button>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
          Tournament Info
        </h3>
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
          <div className="flex justify-between">
            <span>Teams</span>
            <span className="font-semibold">48</span>
          </div>
          <div className="flex justify-between">
            <span>Matches</span>
            <span className="font-semibold">104</span>
          </div>
          <div className="flex justify-between">
            <span>Duration</span>
            <span className="font-semibold">39 days</span>
          </div>
        </div>
      </div>
    </div>
  );
}
