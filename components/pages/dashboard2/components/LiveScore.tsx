import { MockLiveMatch } from "@/mocks/dashboardData";

interface LiveScoreProps {
  match: MockLiveMatch;
}

export default function LiveScore({ match }: LiveScoreProps) {
  return (
    <div className="card p-4 bg-gradient-to-r from-primary/5 to-transparent border-l-4 border-primary">
      <div className="flex items-center justify-between">
        <div className="flex-1 grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
          <div className="text-right">
            <div className="font-bold">{match.homeTeam}</div>
          </div>
          <div className="flex items-center space-x-2 px-4">
            <span className="text-2xl font-bold">{match.homeScore}</span>
            <span className="text-gray-400">:</span>
            <span className="text-2xl font-bold">{match.awayScore}</span>
          </div>
          <div>
            <div className="font-bold">{match.awayTeam}</div>
          </div>
        </div>
        <div className="ml-4 flex items-center space-x-2">
          <span className="text-xs bg-red-500 text-white px-2 py-1 rounded uppercase font-semibold">
            Live
          </span>
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">{match.minute}&apos;</span>
        </div>
      </div>
    </div>
  );
}
