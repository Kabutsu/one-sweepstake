import { trpc } from "@/lib/trpc";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import LiveMatchesSection from "./components/LiveMatchesSection";
import SweepstakeTile from "./components/SweepstakeTile";
import ActionBar from "./components/ActionBar";
import { mockSweepstakes, mockLiveMatches } from "@/mocks/dashboardData";

export default function Dashboard3() {
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <nav className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center">
                <span className="text-white font-black text-lg">OS</span>
              </div>
              <div>
                <div className="text-sm font-black text-gray-900 dark:text-white">ONE SWEEPSTAKE</div>
                <div className="text-xs text-gray-500">World Cup 2026</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {user.displayName}
              </span>
              <button onClick={handleLogout} disabled={logout.isPending} className="btn-secondary text-sm px-4 py-2">
                {logout.isPending ? "..." : "Logout"}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {mockLiveMatches.length > 0 && <LiveMatchesSection matches={mockLiveMatches} />}

        <ActionBar />

        <div>
          <h2 className="text-xl font-bold mb-4">My Sweepstakes</h2>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : displaySweepstakes.length === 0 ? (
            <div className="bg-white dark:bg-black border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
              <h3 className="text-lg font-bold mb-2">No sweepstakes</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Create or join to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {displaySweepstakes.map((sweepstake) => (
                <SweepstakeTile key={sweepstake.id} sweepstake={sweepstake} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
