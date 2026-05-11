"use client";

import { useState } from "react";
import MatchCard from "./MatchCard";

interface Match {
  id: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamCrest?: string | null;
  awayTeamCrest?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  status: string;
  stage?: string | null;
  scheduledAt: Date;
}

interface LiveMatchesSectionProps {
  matches: Match[];
}

export default function LiveMatchesSection({ matches }: LiveMatchesSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!matches.length) {
    return (
      <div className="glass p-6 shadow-xl rounded-xl">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center shadow-inner">
            <svg
              className="w-7 h-7 text-gray-400 dark:text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">No Matches Available</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Matches will appear here when they&apos;re scheduled or in progress
            </p>
          </div>
        </div>
      </div>
    );
  }

  const liveCount = matches.filter((m) => m.status === "IN_PLAY" || m.status === "PAUSED").length;

  const hasMany = matches.length > 2;
  const displayedMatches = hasMany && !isExpanded ? matches.slice(0, 2) : matches;

  return (
    <div className="glass p-6 shadow-2xl rounded-2xl relative overflow-hidden">
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>

      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>

      <div className="flex items-center justify-between mb-6 relative z-10">
        <h2 className="text-lg font-bold tracking-tight flex items-center space-x-2 text-gray-900 dark:text-white">
          {liveCount > 0 ? (
            <>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
              </span>
              <span>Live Matches</span>
            </>
          ) : (
            <span>Upcoming Matches</span>
          )}
        </h2>
        {liveCount > 0 && (
          <span className="text-xs font-semibold bg-gradient-to-r from-primary to-primary-600 text-white px-3 py-1.5 rounded-full shadow-lg">
            {liveCount} Live
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        {displayedMatches.map((match) => (
          <MatchCard
            key={match.id}
            homeTeamName={match.homeTeamName}
            awayTeamName={match.awayTeamName}
            homeTeamCrest={match.homeTeamCrest}
            awayTeamCrest={match.awayTeamCrest}
            homeScore={match.homeScore}
            awayScore={match.awayScore}
            status={match.status}
            stage={match.stage}
            scheduledAt={match.scheduledAt}
          />
        ))}
      </div>

      {hasMany && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 w-full py-2 text-sm font-medium text-primary hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 transition-colors duration-200 flex items-center justify-center space-x-1 relative z-10"
        >
          <span>{isExpanded ? "Show Less" : `Show ${matches.length - 2} More`}</span>
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
    </div>
  );
}
