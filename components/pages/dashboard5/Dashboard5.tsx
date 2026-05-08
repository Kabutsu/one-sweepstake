import { trpc } from "@/lib/trpc";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import DashboardNav from "./components/DashboardNav";
import LiveScoreWidget from "./components/LiveScoreWidget";
import SweepstakesWidget from "./components/SweepstakesWidget";
import QuickActionsWidget from "./components/QuickActionsWidget";
import StatsWidget from "./components/StatsWidget";
import { mockSweepstakes, mockLiveMatches } from "@/mocks/dashboardData";

export default function Dashboard5() {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-100 dark:from-gray-950 dark:via-black dark:to-gray-950">
      <DashboardNav user={user} onLogout={handleLogout} isLoggingOut={logout.isPending} />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">
            Welcome back, {user.displayName}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Here&apos;s what&apos;s happening with your World Cup sweepstakes
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              {mockLiveMatches.length > 0 && <LiveScoreWidget matches={mockLiveMatches} />}
              <SweepstakesWidget sweepstakes={displaySweepstakes} />
            </div>

            <div className="lg:col-span-4 space-y-6">
              <QuickActionsWidget />
              <StatsWidget sweepstakes={displaySweepstakes} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
