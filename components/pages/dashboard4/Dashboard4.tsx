import { trpc } from "@/lib/trpc";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import FeedHeader from "./components/FeedHeader";
import LiveMatchBanner from "./components/LiveMatchBanner";
import SweepstakeFeedItem from "./components/SweepstakeFeedItem";
import QuickCreate from "./components/QuickCreate";
import { mockSweepstakes, mockLiveMatches } from "@/mocks/dashboardData";

export default function Dashboard4() {
  const { data: user } = trpc.auth.me.useQuery();
  const logout = trpc.auth.logout.useMutation();
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const { data: sweepstakes, isLoading } = trpc.sweepstakes.getUserSweepstakes.useQuery();

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
      utils.auth.me.invalidate();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const displaySweepstakes = sweepstakes?.length ? sweepstakes : mockSweepstakes;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <FeedHeader user={user} onLogout={handleLogout} isLoggingOut={logout.isPending} />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {mockLiveMatches.length > 0 && <LiveMatchBanner matches={mockLiveMatches} />}

        <QuickCreate />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Your Feed</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {displaySweepstakes.length} sweepstake{displaySweepstakes.length !== 1 ? "s" : ""}
            </span>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : displaySweepstakes.length === 0 ? (
            <div className="bg-white dark:bg-black p-8 text-center border border-gray-200 dark:border-gray-800">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">Your feed is empty</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create or join a sweepstake to see updates here
              </p>
            </div>
          ) : (
            displaySweepstakes.map((sweepstake) => (
              <SweepstakeFeedItem key={sweepstake.id} sweepstake={sweepstake} />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
