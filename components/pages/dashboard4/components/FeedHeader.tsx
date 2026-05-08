interface FeedHeaderProps {
  user: { displayName: string | null };
  onLogout: () => void;
  isLoggingOut: boolean;
}

export default function FeedHeader({ user, onLogout, isLoggingOut }: FeedHeaderProps) {
  return (
    <header className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">OS</span>
          </div>
          <span className="font-bold text-lg">One Sweepstake</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-2 bg-gray-100 dark:bg-gray-900 px-3 py-2 rounded-full">
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {user.displayName?.[0]?.toUpperCase()}
              </span>
            </div>
            <span className="text-sm font-medium">{user.displayName}</span>
          </div>
          <button onClick={onLogout} disabled={isLoggingOut} className="btn-secondary text-sm px-3 py-2">
            {isLoggingOut ? "..." : "Logout"}
          </button>
        </div>
      </div>
    </header>
  );
}
