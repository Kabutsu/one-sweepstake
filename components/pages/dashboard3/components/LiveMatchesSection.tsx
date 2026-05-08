import { MockLiveMatch } from "@/mocks/dashboardData";

interface LiveMatchesSectionProps {
  matches: MockLiveMatch[];
}

export default function LiveMatchesSection({ matches }: LiveMatchesSectionProps) {
  return (
    <div className="bg-gradient-to-r from-primary to-primary-700 text-white p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black uppercase tracking-wider flex items-center space-x-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          <span>Live Matches</span>
        </h2>
        <span className="text-xs bg-white/20 px-2 py-1 rounded">
          {matches.length} {matches.length === 1 ? "match" : "matches"}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {matches.map((match, index) => (
          <div key={index} className="bg-white/10 backdrop-blur p-4 rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase bg-red-500 px-2 py-1 rounded">
                {match.status === "IN_PLAY" ? "Live" : "HT"}
              </span>
              <span className="text-xs font-bold">{match.minute}&apos;</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold">{match.homeTeam}</span>
                <span className="text-2xl font-black">{match.homeScore}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold">{match.awayTeam}</span>
                <span className="text-2xl font-black">{match.awayScore}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
