import { trpc } from "@/lib/trpc";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import SweepstakeList from "./components/SweepstakeList";
import StatsSidebar from "./components/StatsSidebar";
import LiveScore from "./components/LiveScore";
import { mockSweepstakes, mockLiveMatches } from "@/mocks/dashboardData";

export default function Dashboard2() {
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
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <nav className="bg-surface-light dark:bg-surface-dark border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <h1 className="text-lg font-bold text-primary flex items-center space-x-2">
              <span>One Sweepstake</span>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">v2</span>
            </h1>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">{user.displayName}</span>
              <button onClick={handleLogout} disabled={logout.isPending} className="btn-secondary text-xs px-3 py-2">
                {logout.isPending ? "..." : "Logout"}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-6">
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-1">Dashboard</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">World Cup 2026 Sweepstakes</p>
            </div>

            {mockLiveMatches.length > 0 && (
              <div className="mb-6 space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Live Matches
                </h3>
                {mockLiveMatches.map((match, index) => (
                  <LiveScore key={index} match={match} />
                ))}
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : displaySweepstakes.length === 0 ? (
              <div className="card p-8 text-center">
                <h3 className="text-lg font-bold mb-2">No sweepstakes</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Create or join a sweepstake to get started
                </p>
                <div className="flex gap-3 justify-center">
                  <button className="btn-primary text-sm">Create</button>
                  <button className="btn-secondary text-sm">Join</button>
                </div>
              </div>
            ) : (
              <SweepstakeList sweepstakes={displaySweepstakes} />
            )}
          </div>

          <div className="hidden lg:block">
            <StatsSidebar sweepstakes={displaySweepstakes} />
          </div>
        </div>
      </main>
    </div>
  );
}
