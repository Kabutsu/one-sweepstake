interface JoinCodeCardProps {
  joinCode: string;
  copiedCode: boolean;
  onCopy: () => void;
}

export default function JoinCodeCard({ joinCode, copiedCode, onCopy }: JoinCodeCardProps) {
  return (
    <div className="glass p-6 shadow-xl rounded-2xl border border-white/20 dark:border-white/10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-primary"
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
            </span>
            <span>Join Code</span>
          </h2>
        </div>

        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-xl border-2 border-primary/20">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Share this code with participants
          </p>
          <div className="flex items-center justify-between">
            <code className="text-4xl font-black tracking-wider text-primary">{joinCode}</code>
            <button
              onClick={onCopy}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-all flex items-center space-x-2"
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
                  <span className="text-sm font-semibold">Copied!</span>
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
                  <span className="text-sm font-semibold">Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
