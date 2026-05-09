import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import OverviewTab from "./components/OverviewTab";
import ParticipantsTab from "./components/ParticipantsTab";
import TeamsTab from "./components/TeamsTab";
import ChatTab from "./components/ChatTab";

type TabType = "overview" | "participants" | "teams" | "chat";

export default function SweepstakeDetailV3() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const {
    data: sweepstake,
    isLoading,
    error,
  } = trpc.sweepstakes.getSweepstakeById.useQuery({ id: id! }, { enabled: !!id });

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

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: "📊" },
    { id: "participants" as TabType, label: "Participants", icon: "👥" },
    { id: "teams" as TabType, label: "Teams", icon: "⚽" },
    { id: "chat" as TabType, label: "Chat", icon: "💬" },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <button
        onClick={() => navigate("/dashboard")}
        className="mb-4 text-gray-600 dark:text-gray-400 hover:text-primary flex items-center space-x-2 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span>Back to Dashboard</span>
      </button>

      <div className="glass p-6 shadow-xl rounded-2xl border border-white/20 dark:border-white/10 mb-6">
        <h1 className="text-3xl font-bold mb-1 text-gray-900 dark:text-white">{sweepstake.name}</h1>
        <p className="text-gray-600 dark:text-gray-400">{sweepstake.tournamentName}</p>
      </div>

      {/* Tabs */}
      <div className="glass p-2 shadow-xl rounded-2xl border border-white/20 dark:border-white/10 mb-6">
        <div className="flex space-x-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[120px] px-4 py-3 rounded-xl font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-primary text-white shadow-lg"
                  : "text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-black/20"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="glass p-6 shadow-xl rounded-2xl border border-white/20 dark:border-white/10 min-h-[400px]">
        {activeTab === "overview" && <OverviewTab sweepstake={sweepstake} />}
        {activeTab === "participants" && <ParticipantsTab sweepstake={sweepstake} />}
        {activeTab === "teams" && <TeamsTab />}
        {activeTab === "chat" && <ChatTab />}
      </div>
    </div>
  );
}
