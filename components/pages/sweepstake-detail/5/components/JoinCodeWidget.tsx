interface JoinCodeWidgetProps {
  joinCode: string;
  copiedCode: boolean;
  onCopy: () => void;
}

export default function JoinCodeWidget({ joinCode, copiedCode, onCopy }: JoinCodeWidgetProps) {
  return (
    <div className="glass p-5 shadow-xl rounded-2xl border border-white/20 dark:border-white/10 relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>

      <div className="relative">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
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
          </div>
          <h3 className="font-bold text-sm text-gray-900 dark:text-white">Join Code</h3>
        </div>

        <code className="text-3xl font-black tracking-wider text-primary block mb-3">
          {joinCode}
        </code>

        <button
          onClick={onCopy}
          className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-600 transition-all text-sm font-semibold"
        >
          {copiedCode ? "Copied!" : "Copy Code"}
        </button>
      </div>
    </div>
  );
}
