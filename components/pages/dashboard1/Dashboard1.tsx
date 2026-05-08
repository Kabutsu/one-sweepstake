import { trpc } from "@/lib/trpc";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import LiveMatchTicker from "./components/LiveMatchTicker";
import SweepstakeCard from "./components/SweepstakeCard";
import { mockSweepstakes, mockLiveMatches } from "@/mocks/dashboardData";

export default function Dashboard1() {
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
    <div className="min-h-screen bg-gradient-to-br from-background-light to-gray-50 dark:from-background-dark dark:to-gray-950">
      <nav className="bg-surface-light dark:bg-surface-dark border-b-2 border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">1</span>
              </div>
              <h1 className="text-xl font-bold text-primary">One Sweepstake</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {user.displayName}
              </span>
              <button
                onClick={handleLogout}
                disabled={logout.isPending}
                className="btn-secondary text-sm px-4 py-2"
              >
                {logout.isPending ? "..." : "Logout"}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {mockLiveMatches.length > 0 && <LiveMatchTicker matches={mockLiveMatches} />}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Your Sweepstakes</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and track all your World Cup sweepstakes
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : displaySweepstakes.length === 0 ? (
          <div className="card p-12 text-center animate-fade-in">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">No sweepstakes yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Create or join a sweepstake to get started with your World Cup experience
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="btn-primary">Create Sweepstake</button>
                <button className="btn-secondary">Join with Code</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
            {displaySweepstakes.map((sweepstake) => (
              <SweepstakeCard key={sweepstake.id} sweepstake={sweepstake} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
