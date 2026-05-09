interface StatsWidgetProps {
  currentParticipants: number;
  maxParticipants: number;
  drawCompletedAt: Date | null;
  createdAt: Date;
}

export default function StatsWidget({
  currentParticipants,
  maxParticipants,
  drawCompletedAt,
  createdAt,
}: StatsWidgetProps) {
  const progress = (currentParticipants / maxParticipants) * 100;

  return (
    <div className="glass p-5 shadow-xl rounded-2xl border border-white/20 dark:border-white/10">
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
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
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <h3 className="font-bold text-sm text-gray-900 dark:text-white">Stats</h3>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500 dark:text-gray-400">Participants</span>
            <span className="font-bold text-gray-900 dark:text-white">
              {currentParticipants}/{maxParticipants}
            </span>
          </div>
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary-600"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Created</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {new Date(createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {drawCompletedAt ? "Active" : "Pending"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
