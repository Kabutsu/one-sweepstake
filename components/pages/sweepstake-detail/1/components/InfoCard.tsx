interface Sweepstake {
  id: string;
  name: string;
  tournamentName: string;
  creatorId: string;
  maxParticipants: number;
  currentParticipants: number;
  drawCompletedAt: Date | null;
  createdAt: Date;
  isCreator: boolean;
}

interface InfoCardProps {
  sweepstake: Sweepstake;
}

export default function InfoCard({ sweepstake }: InfoCardProps) {
  return (
    <div className="glass p-6 shadow-xl rounded-2xl border border-white/20 dark:border-white/10">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center space-x-2">
        <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
          <svg
            className="w-5 h-5 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </span>
        <span>Info</span>
      </h2>

      <div className="space-y-4">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</p>
          <div className="flex items-center space-x-2">
            <span
              className={`w-3 h-3 rounded-full ${sweepstake.drawCompletedAt ? "bg-green-500" : "bg-yellow-500"}`}
            />
            <p className="font-semibold text-gray-900 dark:text-white">
              {sweepstake.drawCompletedAt ? "Draw Completed" : "Waiting for Draw"}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Created</p>
          <p className="font-semibold text-gray-900 dark:text-white">
            {new Date(sweepstake.createdAt).toLocaleDateString()}
          </p>
        </div>

        {sweepstake.drawCompletedAt && (
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Draw Completed</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {new Date(sweepstake.drawCompletedAt).toLocaleDateString()}
            </p>
          </div>
        )}

        {sweepstake.isCreator && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Your Role</p>
            <span className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary text-sm font-semibold rounded-lg">
              Creator
            </span>
          </div>
        )}

        {sweepstake.isCreator && !sweepstake.drawCompletedAt && (
          <button
            disabled
            className="w-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 py-3 rounded-xl font-semibold cursor-not-allowed"
          >
            Draw Teams (Coming Soon)
          </button>
        )}
      </div>
    </div>
  );
}
