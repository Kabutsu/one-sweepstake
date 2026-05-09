import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import JoinCodeCard from "./components/JoinCodeCard";
import ParticipantsCard from "./components/ParticipantsCard";
import InfoCard from "./components/InfoCard";
import PlaceholderCard from "./components/PlaceholderCard";

export default function SweepstakeDetailV1() {
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
    <div className="max-w-6xl mx-auto">
      <button
        onClick={() => navigate("/dashboard")}
        className="mb-4 text-gray-600 dark:text-gray-400 hover:text-primary flex items-center space-x-2 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span>Back to Dashboard</span>
      </button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">{sweepstake.name}</h1>
        <p className="text-gray-600 dark:text-gray-400">{sweepstake.tournamentName}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <JoinCodeCard
            joinCode={sweepstake.joinCode}
            copiedCode={copiedCode}
            onCopy={handleCopyCode}
          />

          <ParticipantsCard
            participants={sweepstake.participants}
            maxParticipants={sweepstake.maxParticipants}
            currentParticipants={sweepstake.currentParticipants}
          />

          <PlaceholderCard
            title="Team Assignments"
            icon="🏆"
            description="Team assignments will appear here after the draw is completed."
          />

          <PlaceholderCard
            title="Live Chat"
            icon="💬"
            description="Chat with other participants during the tournament."
          />
        </div>

        <div className="space-y-6">
          <InfoCard sweepstake={sweepstake} />

          <PlaceholderCard
            title="Leaderboard"
            icon="📊"
            description="Track participant rankings as the tournament progresses."
          />

          <PlaceholderCard
            title="Match Schedule"
            icon="📅"
            description="View upcoming matches and live scores."
          />
        </div>
      </div>
    </div>
  );
}
