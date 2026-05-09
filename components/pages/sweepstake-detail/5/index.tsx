import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import TitleWidget from "./components/TitleWidget";
import JoinCodeWidget from "./components/JoinCodeWidget";
import StatsWidget from "./components/StatsWidget";
import ParticipantsWidget from "./components/ParticipantsWidget";
import QuickActionsWidget from "./components/QuickActionsWidget";
import PlaceholderWidget from "./components/PlaceholderWidget";

export default function SweepstakeDetailV5() {
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
    <div className="max-w-7xl mx-auto">
      <button
        onClick={() => navigate("/dashboard")}
        className="mb-4 text-gray-600 dark:text-gray-400 hover:text-primary flex items-center space-x-2 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span>Back to Dashboard</span>
      </button>

      <TitleWidget sweepstake={sweepstake} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {/* Row 1 */}
        <JoinCodeWidget
          joinCode={sweepstake.joinCode}
          copiedCode={copiedCode}
          onCopy={handleCopyCode}
        />

        <StatsWidget
          currentParticipants={sweepstake.currentParticipants}
          maxParticipants={sweepstake.maxParticipants}
          drawCompletedAt={sweepstake.drawCompletedAt}
          createdAt={sweepstake.createdAt}
        />

        {sweepstake.isCreator && (
          <QuickActionsWidget drawCompletedAt={sweepstake.drawCompletedAt} />
        )}

        {/* Row 2 - Full Width Participants */}
        <div className="md:col-span-2 lg:col-span-3">
          <ParticipantsWidget
            participants={sweepstake.participants}
            maxParticipants={sweepstake.maxParticipants}
            currentParticipants={sweepstake.currentParticipants}
          />
        </div>

        {/* Row 3 - Placeholders */}
        <PlaceholderWidget
          title="Teams"
          icon="⚽"
          description="Team assignments after draw"
          compact
        />

        <PlaceholderWidget title="Chat" icon="💬" description="Real-time messaging" compact />

        <PlaceholderWidget title="Rankings" icon="📊" description="Live leaderboard" compact />
      </div>
    </div>
  );
}
