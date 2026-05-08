export default function QuickActionsWidget() {
  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="border-b border-gray-200 dark:border-gray-800 p-4">
        <h2 className="font-bold text-sm uppercase tracking-wide">Quick Actions</h2>
      </div>
      <div className="p-4 space-y-3">
        <button className="w-full flex items-center space-x-3 p-4 bg-gradient-to-r from-primary to-primary-700 text-white rounded-lg hover:shadow-lg transition-shadow group">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div className="flex-1 text-left">
            <div className="font-bold">Create Sweepstake</div>
            <div className="text-xs opacity-90">Start a new competition</div>
          </div>
          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button className="w-full flex items-center space-x-3 p-4 border-2 border-primary hover:bg-primary hover:text-white rounded-lg transition-colors group">
          <div className="w-10 h-10 bg-primary/10 group-hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors">
            <svg className="w-5 h-5 text-primary group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <div className="flex-1 text-left">
            <div className="font-bold">Join with Code</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 group-hover:text-white/90">Enter an invite code</div>
          </div>
          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
