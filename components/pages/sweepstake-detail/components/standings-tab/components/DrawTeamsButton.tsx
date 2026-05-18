import { useState } from "react";
import { trpc } from "@/lib/trpc";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface DrawTeamsButtonProps {
  sweepstakeId: string;
  onDrawComplete?: () => void;
}

export default function DrawTeamsButton({ sweepstakeId, onDrawComplete }: DrawTeamsButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const utils = trpc.useUtils();

  const executeDraw = trpc.sweepstakes.executeDraw.useMutation({
    onSuccess: () => {
      // Invalidate queries to refetch updated data
      utils.sweepstakes.getSweepstakeById.invalidate({ id: sweepstakeId });
      utils.sweepstakes.getTeamAssignments.invalidate({ sweepstakeId });
      utils.sweepstakes.getLeaderboard.invalidate({ sweepstakeId });
      setShowModal(false);
      onDrawComplete?.();
    },
  });

  const handleConfirm = () => {
    executeDraw.mutate({ sweepstakeId });
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
      >
        <div className="flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <span>Draw Teams</span>
        </div>
      </button>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 top-16 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-black max-w-md w-full p-6 rounded-2xl shadow-2xl border border-white/30 dark:border-white/10">
            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 rounded-xl">
                <svg
                  className="w-6 h-6 text-indigo-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Confirm Team Draw
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Are you ready to draw teams?
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Warning:</strong> This action cannot be undone. Once teams are drawn:
              </p>
              <ul className="mt-2 ml-4 text-sm text-yellow-800 dark:text-yellow-200 space-y-1 list-disc">
                <li>Teams will be randomly assigned to all participants</li>
                <li>The sweepstake will be locked</li>
                <li>No new participants can join</li>
              </ul>
            </div>

            {/* Error State */}
            {executeDraw.error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {executeDraw.error.message}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={executeDraw.isPending}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={executeDraw.isPending}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {executeDraw.isPending ? (
                  <div className="flex items-center justify-center gap-2">
                    <LoadingSpinner size="sm" />
                    <span>Drawing...</span>
                  </div>
                ) : (
                  "Confirm Draw"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
