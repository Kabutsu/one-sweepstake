import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Header from "./components/Header";
import JoinCodeFeed from "./components/JoinCodeFeed";
import ParticipantsFeed from "./components/ParticipantsFeed";
import ActivityFeed from "./components/ActivityFeed";

export default function SweepstakeDetailV4() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [copiedCode, setCopiedCode] = useState(false);

  const {
    data: sweepstake,
    isLoading,
    error,
  } = trpc.sweepstakes.getSweepstakeById.useQuery({ id: id! }, { enabled: !!id });

  const handleCopyCode = async () => {
    if (sweepstake?.joinCode) {
      await navigator.clipboard.writeText(sweepstake.joinCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !sweepstake) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="glass p-8 rounded-2xl max-w-md text-center">
          <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
            Sweepstake Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error?.message || "This sweepstake doesn't exist or you don't have access to it."}
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate("/dashboard")}
        className="mb-4 text-gray-600 dark:text-gray-400 hover:text-primary flex items-center space-x-2 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span>Back to Dashboard</span>
      </button>

      <div className="space-y-4">
        <Header sweepstake={sweepstake} />

        <JoinCodeFeed
          joinCode={sweepstake.joinCode}
          copiedCode={copiedCode}
          onCopy={handleCopyCode}
        />

        <ParticipantsFeed
          participants={sweepstake.participants}
          maxParticipants={sweepstake.maxParticipants}
          currentParticipants={sweepstake.currentParticipants}
        />

        <ActivityFeed
          isCreator={sweepstake.isCreator}
          drawCompletedAt={sweepstake.drawCompletedAt}
          createdAt={sweepstake.createdAt}
        />

        {/* Upcoming Features Feed */}
        <div className="glass p-6 shadow-xl rounded-2xl border border-dashed border-gray-300/50 dark:border-gray-700/50">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🏆</span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                Team Assignments Coming Soon
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Teams will appear here after the draw is completed
              </p>
            </div>
          </div>
        </div>

        <div className="glass p-6 shadow-xl rounded-2xl border border-dashed border-gray-300/50 dark:border-gray-700/50">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">💬</span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                Live Chat Coming Soon
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Chat with participants during the tournament
              </p>
            </div>
          </div>
        </div>

        <div className="glass p-6 shadow-xl rounded-2xl border border-dashed border-gray-300/50 dark:border-gray-700/50">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">📊</span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                Leaderboard & Standings
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Track rankings as the tournament progresses
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
