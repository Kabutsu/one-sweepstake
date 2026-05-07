import { trpc } from "@/lib/trpc";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function Dashboard() {
  const { data: user } = trpc.auth.me.useQuery();
  const logout = trpc.auth.logout.useMutation();
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
      utils.auth.me.invalidate();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-light to-gray-100 dark:from-background-dark dark:to-gray-900">
      <nav className="bg-surface-light dark:bg-surface-dark border-b-2 border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-primary">One Sweepstake</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {user.displayName}
              </span>
              <button
                onClick={handleLogout}
                disabled={logout.isPending}
                className="btn-secondary text-sm px-4 py-2"
              >
                {logout.isPending ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-8 animate-fade-in">
          <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Welcome back, {user.displayName}! Your sweepstakes will appear here.
          </p>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-none p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No sweepstakes yet. Create or join one to get started!
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
