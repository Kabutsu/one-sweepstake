import { MockLiveMatch } from "@/mocks/dashboardData";

interface LiveScoreWidgetProps {
  matches: MockLiveMatch[];
}

export default function LiveScoreWidget({ matches }: LiveScoreWidgetProps) {
  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="border-b border-gray-200 dark:border-gray-800 p-4 bg-gradient-to-r from-red-50 to-transparent dark:from-red-950">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <h2 className="font-bold text-sm uppercase tracking-wide">Live Matches</h2>
        </div>
      </div>
      <div className="p-4 space-y-4">
        {matches.map((match, index) => (
          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold">{match.homeTeam}</span>
                <span className="text-2xl font-black text-primary">{match.homeScore}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold">{match.awayTeam}</span>
                <span className="text-2xl font-black text-primary">{match.awayScore}</span>
              </div>
            </div>
            <div className="ml-6 text-right">
              <div className="text-xs font-bold bg-red-500 text-white px-2 py-1 rounded mb-1">
                {match.status === "IN_PLAY" ? "LIVE" : "HT"}
              </div>
              <div className="text-sm font-bold text-gray-600 dark:text-gray-400">{match.minute}&apos;</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
