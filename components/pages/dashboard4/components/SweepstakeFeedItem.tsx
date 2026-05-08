import { MockSweepstake } from "@/mocks/dashboardData";

interface SweepstakeFeedItemProps {
  sweepstake: MockSweepstake;
}

export default function SweepstakeFeedItem({ sweepstake }: SweepstakeFeedItemProps) {
  const isDrawComplete = sweepstake.drawCompletedAt !== null;

  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 hover:border-primary/50 transition-colors cursor-pointer">
      <div className="p-4 border-b border-gray-100 dark:border-gray-900">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">{sweepstake.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{sweepstake.tournamentName}</p>
          </div>
          {isDrawComplete ? (
            <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">
              ACTIVE
            </span>
          ) : (
            <span className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200 text-xs font-bold px-3 py-1 rounded-full">
              PENDING
            </span>
          )}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>{sweepstake.currentParticipants} / {sweepstake.maxParticipants}</span>
            </div>
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{new Date(sweepstake.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <button className="text-primary font-semibold hover:underline">View →</button>
        </div>
      </div>
    </div>
  );
}
