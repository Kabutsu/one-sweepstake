import { useNavigate } from "react-router-dom";

export default function ActionBar() {
  const navigate = useNavigate();

  return (
    <div className="glass p-5 shadow-xl rounded-2xl border border-white/20 dark:border-white/10">
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => navigate("/sweepstake/create")}
          className="flex-1 bg-gradient-to-r from-primary to-primary-600 text-white py-3.5 rounded-xl flex items-center justify-center space-x-2 hover:shadow-xl transition-all duration-300 font-semibold"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Create Sweepstake</span>
        </button>
        <button className="flex-1 border-2 border-primary text-primary py-3.5 rounded-xl flex items-center justify-center space-x-2 hover:bg-primary hover:text-white hover:shadow-xl transition-all duration-300 font-semibold bg-white/30 dark:bg-black/20">
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
          <span>Join with Code</span>
        </button>
      </div>
    </div>
  );
}
