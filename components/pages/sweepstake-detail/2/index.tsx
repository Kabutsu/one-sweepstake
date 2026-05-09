import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Sidebar from "./components/Sidebar";
import ParticipantsList from "./components/ParticipantsList";
import EmptyState from "./components/EmptyState";

export default function SweepstakeDetailV2() {
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

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-80 flex-shrink-0">
          <Sidebar sweepstake={sweepstake} copiedCode={copiedCode} onCopyCode={handleCopyCode} />
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          <div className="glass p-6 shadow-xl rounded-2xl border border-white/20 dark:border-white/10">
            <h2 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">
              {sweepstake.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{sweepstake.tournamentName}</p>

            <ParticipantsList
              participants={sweepstake.participants}
              maxParticipants={sweepstake.maxParticipants}
              currentParticipants={sweepstake.currentParticipants}
            />
          </div>

          <EmptyState
            title="Team Assignments"
            description="Teams will be randomly assigned to participants after the draw."
            icon={
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            }
          />

          <EmptyState
            title="Live Chat"
            description="Connect with other participants and discuss the matches in real-time."
            icon={
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            }
          />

          <EmptyState
            title="Leaderboard & Standings"
            description="Track who's leading as teams progress through the tournament."
            icon={
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            }
          />
        </div>
      </div>
    </div>
  );
}
