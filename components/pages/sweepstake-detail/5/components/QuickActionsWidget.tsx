interface QuickActionsWidgetProps {
  drawCompletedAt: Date | null;
}

export default function QuickActionsWidget({ drawCompletedAt }: QuickActionsWidgetProps) {
  if (drawCompletedAt) return null;

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
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <h3 className="font-bold text-sm text-gray-900 dark:text-white">Quick Actions</h3>
      </div>

      <div className="space-y-2">
        <button
          disabled
          className="w-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 py-2.5 rounded-lg text-sm font-semibold cursor-not-allowed"
        >
          Draw Teams (Soon)
        </button>
        <button
          disabled
          className="w-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 py-2.5 rounded-lg text-sm font-semibold cursor-not-allowed"
        >
          Settings (Soon)
        </button>
      </div>
    </div>
  );
}
