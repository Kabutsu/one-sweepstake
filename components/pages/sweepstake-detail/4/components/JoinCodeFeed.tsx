interface JoinCodeFeedProps {
  joinCode: string;
  copiedCode: boolean;
  onCopy: () => void;
}

export default function JoinCodeFeed({ joinCode, copiedCode, onCopy }: JoinCodeFeedProps) {
  return (
    <div className="glass p-6 shadow-xl rounded-2xl border border-white/20 dark:border-white/10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl"></div>

      <div className="relative flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Join Code</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Share with participants</p>
            </div>
          </div>
          <code className="text-4xl font-black tracking-wider text-primary block">{joinCode}</code>
        </div>
        <button
          onClick={onCopy}
          className="bg-primary text-white px-6 py-4 rounded-xl hover:bg-primary-600 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2 ml-4"
        >
          {copiedCode ? (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span className="font-semibold">Copy</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
