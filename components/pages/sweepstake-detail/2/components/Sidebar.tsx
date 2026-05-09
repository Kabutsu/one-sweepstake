interface Sweepstake {
  id: string;
  joinCode: string;
  maxParticipants: number;
  currentParticipants: number;
  drawCompletedAt: Date | null;
  createdAt: Date;
  isCreator: boolean;
}

interface SidebarProps {
  sweepstake: Sweepstake;
  copiedCode: boolean;
  onCopyCode: () => void;
}

export default function Sidebar({ sweepstake, copiedCode, onCopyCode }: SidebarProps) {
  const progress = (sweepstake.currentParticipants / sweepstake.maxParticipants) * 100;

  return (
    <div className="space-y-6 sticky top-6">
      {/* Join Code */}
      <div className="glass p-6 shadow-xl rounded-2xl border border-white/20 dark:border-white/10">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">JOIN CODE</h3>
        <div className="bg-gradient-to-br from-primary/20 to-primary/10 p-4 rounded-xl mb-3">
          <code className="text-3xl font-black tracking-widest text-primary block text-center">
            {sweepstake.joinCode}
          </code>
        </div>
        <button
          onClick={onCopyCode}
          className="w-full bg-primary text-white py-2.5 rounded-lg hover:bg-primary-600 transition-all flex items-center justify-center space-x-2 font-semibold"
        >
          {copiedCode ? (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>

      {/* Stats */}
      <div className="glass p-6 shadow-xl rounded-2xl border border-white/20 dark:border-white/10">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4">STATS</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">Participants</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {sweepstake.currentParticipants} / {sweepstake.maxParticipants}
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary-600"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Status</span>
              <div className="flex items-center space-x-2">
                <span
                  className={`w-2 h-2 rounded-full ${sweepstake.drawCompletedAt ? "bg-green-500" : "bg-yellow-500"}`}
                />
                <span className="font-semibold text-gray-900 dark:text-white">
                  {sweepstake.drawCompletedAt ? "Active" : "Pending"}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm">
              <span className="text-gray-600 dark:text-gray-400 block mb-1">Created</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {new Date(sweepstake.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {sweepstake.isCreator && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <span className="inline-flex items-center px-3 py-1.5 bg-primary/10 text-primary text-sm font-bold rounded-lg">
                <svg
                  className="w-4 h-4 mr-1.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
                Creator
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {sweepstake.isCreator && !sweepstake.drawCompletedAt && (
        <div className="glass p-6 shadow-xl rounded-2xl border border-white/20 dark:border-white/10">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">ACTIONS</h3>
          <button
            disabled
            className="w-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 py-2.5 rounded-lg font-semibold cursor-not-allowed"
          >
            Draw Teams (Coming Soon)
          </button>
        </div>
      )}
    </div>
  );
}
