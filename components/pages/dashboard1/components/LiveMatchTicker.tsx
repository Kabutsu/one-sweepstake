import { MockLiveMatch } from "@/mocks/dashboardData";

interface LiveMatchTickerProps {
  matches: MockLiveMatch[];
}

export default function LiveMatchTicker({ matches }: LiveMatchTickerProps) {
  return (
    <div className="bg-primary text-white border-b-2 border-primary-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center space-x-6 overflow-x-auto">
          <span className="text-sm font-bold uppercase tracking-wide flex-shrink-0">Live Now</span>
          {matches.map((match, index) => (
            <div key={index} className="flex items-center space-x-3 flex-shrink-0 animate-fade-in">
              <div className="flex items-center space-x-2">
                <span className="font-medium">{match.homeTeam}</span>
                <span className="font-bold text-lg">{match.homeScore}</span>
              </div>
              <span className="text-white/60">-</span>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg">{match.awayScore}</span>
                <span className="font-medium">{match.awayTeam}</span>
              </div>
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                {match.minute}&apos;
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
