import { useState } from "react";

interface Sweepstake {
  id: string;
  joinCode: string;
  maxParticipants: number;
  currentParticipants: number;
  drawCompletedAt: Date | null;
  createdAt: Date;
  isCreator: boolean;
}

interface OverviewTabProps {
  sweepstake: Sweepstake;
}

export default function OverviewTab({ sweepstake }: OverviewTabProps) {
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(sweepstake.joinCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const progress = (sweepstake.currentParticipants / sweepstake.maxParticipants) * 100;

  return (
    <div className="space-y-6">
      {/* Join Code Section */}
      <div>
        <h2 className="text-lg font-bold mb-3 text-gray-900 dark:text-white">Join Code</h2>
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 rounded-xl border-2 border-primary/20">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Share this code to invite participants
          </p>
          <div className="flex items-center justify-between">
            <code className="text-2xl sm:text-4xl font-black tracking-wider text-primary">
              {sweepstake.joinCode}
            </code>
            <button
              onClick={handleCopyCode}
              className="bg-primary text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg hover:bg-primary-600 transition-all flex items-center space-x-2"
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
                  <span className="font-semibold">Copied!</span>
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
                  <span className="font-semibold">Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div>
        <h2 className="text-lg font-bold mb-3 text-gray-900 dark:text-white">Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/50 dark:bg-black/20 p-4 rounded-xl">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Participants</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">
              {sweepstake.currentParticipants}
              <span className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                /{sweepstake.maxParticipants}
              </span>
            </p>
          </div>

          <div className="bg-white/50 dark:bg-black/20 p-4 rounded-xl">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Open Spots</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">
              {sweepstake.maxParticipants - sweepstake.currentParticipants}
            </p>
          </div>

          <div className="bg-white/50 dark:bg-black/20 p-4 rounded-xl">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</p>
            <div className="flex items-center space-x-2">
              <span
                className={`w-2 h-2 rounded-full ${sweepstake.drawCompletedAt ? "bg-green-500" : "bg-yellow-500"}`}
              />
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {sweepstake.drawCompletedAt ? "Active" : "Pending"}
              </p>
            </div>
          </div>

          <div className="bg-white/50 dark:bg-black/20 p-4 rounded-xl">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Created</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {new Date(sweepstake.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div>
        <h2 className="text-lg font-bold mb-3 text-gray-900 dark:text-white">
          Participation Progress
        </h2>
        <div className="bg-white/50 dark:bg-black/20 p-6 rounded-xl">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">Filled</span>
            <span className="font-bold text-gray-900 dark:text-white">{Math.round(progress)}%</span>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action Section */}
      {sweepstake.isCreator && !sweepstake.drawCompletedAt && (
        <div>
          <h2 className="text-lg font-bold mb-3 text-gray-900 dark:text-white">Actions</h2>
          <button
            disabled
            className="w-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 py-4 rounded-xl font-bold cursor-not-allowed"
          >
            Draw Teams (Coming Soon)
          </button>
        </div>
      )}
    </div>
  );
}
