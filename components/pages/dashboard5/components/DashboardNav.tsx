interface DashboardNavProps {
  user: { displayName: string | null };
  onLogout: () => void;
  isLoggingOut: boolean;
}

export default function DashboardNav({ user, onLogout, isLoggingOut }: DashboardNavProps) {
  return (
    <nav className="bg-white/80 dark:bg-black/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-700 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-black text-sm">OS</span>
              </div>
              <span className="font-black text-lg">One Sweepstake</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="hidden sm:flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors">
              <div className="w-7 h-7 bg-gradient-to-br from-primary to-primary-700 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {user.displayName?.[0]?.toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-semibold">{user.displayName}</span>
            </button>
            <button onClick={onLogout} disabled={isLoggingOut} className="btn-secondary text-sm px-4 py-2">
              {isLoggingOut ? "..." : "Logout"}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
