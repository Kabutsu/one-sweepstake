export default function ActionBar() {
  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 p-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <button className="flex-1 btn-primary py-3 flex items-center justify-center space-x-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className="font-semibold">Create Sweepstake</span>
        </button>
        <button className="flex-1 btn-secondary py-3 flex items-center justify-center space-x-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          <span className="font-semibold">Join with Code</span>
        </button>
      </div>
    </div>
  );
}
