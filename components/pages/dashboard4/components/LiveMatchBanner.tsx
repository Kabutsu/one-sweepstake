import { MockLiveMatch } from "@/mocks/dashboardData";

interface LiveMatchBannerProps {
  matches: MockLiveMatch[];
}

export default function LiveMatchBanner({ matches }: LiveMatchBannerProps) {
  return (
    <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 shadow-lg">
      <div className="flex items-center space-x-2 mb-3">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <span className="text-xs font-bold uppercase tracking-wider">Live Now</span>
      </div>
      <div className="space-y-3">
        {matches.map((match, index) => (
          <div key={index} className="flex items-center justify-between bg-white/10 backdrop-blur p-3 rounded">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold">{match.homeTeam}</span>
                <span className="text-xl font-bold">{match.homeScore}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">{match.awayTeam}</span>
                <span className="text-xl font-bold">{match.awayScore}</span>
              </div>
            </div>
            <div className="ml-4 text-center">
              <div className="text-xs bg-white/20 px-2 py-1 rounded mb-1">{match.minute}&apos;</div>
              <div className="text-xs opacity-75">{match.status === "IN_PLAY" ? "Playing" : "Half Time"}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
