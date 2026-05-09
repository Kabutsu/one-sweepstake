import { trpc } from "@/lib/trpc";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import LiveMatchesSection from "./components/LiveMatchesSection";
import SweepstakeTile from "./components/SweepstakeTile";
import ActionBar from "./components/ActionBar";
import { mockSweepstakes, mockLiveMatches } from "@/mocks/dashboardData";

const emptySweepstakes: typeof mockSweepstakes = [];
const emptyLiveMatches: typeof mockLiveMatches = [];

export default function Dashboard() {
  const { data: user } = trpc.auth.me.useQuery();
  const { data: sweepstakes, isLoading } = trpc.sweepstakes.getUserSweepstakes.useQuery();

  const displaySweepstakes = sweepstakes || mockSweepstakes;
  const [match] = mockLiveMatches;

  if (!user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">
          Welcome{displaySweepstakes.length ? ' back' : ''}, {user.displayName}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Here&apos;s what&apos;s happening with your sweepstakes
        </p>
      </div>
      
      <LiveMatchesSection matches={[match]} />

      <ActionBar />

      <div>
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          My Sweepstakes
        </h2>
        {displaySweepstakes.length === 0 ? (
          <div className="glass p-12 text-center shadow-2xl rounded-2xl border-2 border-dashed border-gray-300/50 dark:border-gray-700/50">
            <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
              No Sweepstakes Yet
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Start your World Cup 2026 journey by creating a sweepstake or joining one with a code
            </p>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              Compete with friends and family for ultimate bragging rights
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {displaySweepstakes.map((sweepstake) => (
              <SweepstakeTile key={sweepstake.id} sweepstake={sweepstake} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
