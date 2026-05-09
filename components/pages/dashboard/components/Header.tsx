import { useNavigate } from "react-router-dom";

import { trpc } from "@/lib/trpc";
import { AuthUser } from "@/lib/auth";

import ThemeToggle from "@/components/ui/ThemeToggle";

type Props = {
  user: AuthUser;
};

function Initials(name: string | null) {
  if (!name) return "🥸";

  const parts = name.trim().split(" ");
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  } else {
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
}

export default function AppHeader({ user }: Props) {
  const logout = trpc.auth.logout.useMutation();
  const utils = trpc.useUtils();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
      utils.auth.me.invalidate();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="glass sticky top-0 z-50 shadow-lg shadow-primary/5 border-b-4 border-primary-500">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center shadow-lg rounded">
              <span className="text-white font-black text-lg">OS</span>
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-black text-gray-900 dark:text-white tracking-tight min-w-max">
                ONE SWEEPSTAKE
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">World Cup 2026</div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              disabled={logout.isPending}
              className="btn-secondary text-sm px-4 py-2 rounded-sm transition-all"
            >
              {logout.isPending ? "..." : "Logout"}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
