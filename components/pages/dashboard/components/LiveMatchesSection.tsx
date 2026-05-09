import { MockLiveMatch } from "@/mocks/dashboardData";

interface LiveMatchesSectionProps {
  matches: MockLiveMatch[];
}

export default function LiveMatchesSection({ matches }: LiveMatchesSectionProps) {
  if (!matches.length) {
    return (
      <div className="glass p-6 shadow-xl rounded-xl">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-br from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center shadow-inner">
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
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">
              No Live Matches Currently
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Matches will appear here when they&apos;re in progress
            </p>
          </div>
        </div>
      </div>
    );
  }

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
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
          </span>
          <span>Live Matches</span>
        </h2>
        <span className="text-xs font-semibold bg-gradient-to-r from-primary to-primary-600 text-white px-3 py-1.5 rounded-full shadow-lg">
          {matches.length} Live
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        {matches.map((match, index) => (
          <div
            key={index}
            className="glass p-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 dark:border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold bg-red-600 text-white px-3 py-1.5 rounded-full shadow-md pulse-glow">
                {match.status === "IN_PLAY" ? "● Live" : "Half Time"}
              </span>
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-black/30 px-2 py-1 rounded">
                {match.minute}&apos;
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {match.homeTeam}
                </span>
                <span className="text-3xl font-black bg-gradient-to-br from-primary to-primary-600 bg-clip-text text-transparent">
                  {match.homeScore}
                </span>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent"></div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {match.awayTeam}
                </span>
                <span className="text-3xl font-black bg-gradient-to-br from-primary to-primary-600 bg-clip-text text-transparent">
                  {match.awayScore}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
