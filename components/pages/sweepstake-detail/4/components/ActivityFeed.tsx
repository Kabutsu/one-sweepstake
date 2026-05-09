interface ActivityFeedProps {
  isCreator: boolean;
  drawCompletedAt: Date | null;
  createdAt: Date;
}

export default function ActivityFeed({ isCreator, drawCompletedAt, createdAt }: ActivityFeedProps) {
  return (
    <div className="glass p-6 shadow-xl rounded-2xl border border-white/20 dark:border-white/10">
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <svg
            className="w-6 h-6 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">Activity</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Recent updates</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex space-x-3">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 mt-2"></div>
          </div>
          <div className="flex-1 pb-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Sweepstake Created
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        {drawCompletedAt ? (
          <div className="flex space-x-3">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Draw Completed</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(drawCompletedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex space-x-3">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Waiting for Draw
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
              {isCreator && (
                <button
                  disabled
                  className="mt-2 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-4 py-2 rounded-lg text-xs font-semibold cursor-not-allowed"
                >
                  Draw Teams (Coming Soon)
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
