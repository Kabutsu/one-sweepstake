import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function JoinSweepstake() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");

  const joinMutation = trpc.sweepstakes.joinSweepstake.useMutation({
    onSuccess: (data) => {
      navigate(`/sweepstake/${data.sweepstakeId}`);
    },
    onError: (err) => {
      setError(err.message || "Failed to join sweepstake");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedCode = joinCode.trim();
    if (!trimmedCode) {
      setError("Please enter a join code");
      return;
    }

    joinMutation.mutate({
      joinCode: trimmedCode,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setJoinCode(value);
    if (error) setError("");
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => navigate("/dashboard")}
        className="mb-4 text-gray-600 dark:text-gray-400 hover:text-primary flex items-center space-x-2 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span>Back to Dashboard</span>
      </button>

      <div className="glass p-8 shadow-2xl rounded-2xl border border-white/20 dark:border-white/10">
        <div className="mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg
              className="w-8 h-8 text-primary"
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
          </div>
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white text-center">
            Join Sweepstake
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-center">
            Enter the join code shared with you to participate
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="joinCode"
              className="block text-sm font-semibold mb-2 text-gray-900 dark:text-white"
            >
              Join Code
            </label>
            <input
              id="joinCode"
              type="text"
              value={joinCode}
              onChange={handleInputChange}
              placeholder="Enter code (e.g., ABC123)"
              className="w-full px-4 py-4 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-center text-2xl font-bold tracking-wider uppercase"
              maxLength={8}
              disabled={joinMutation.isPending}
              autoComplete="off"
              autoFocus
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              The code is case-insensitive and typically 6-8 characters
            </p>
          </div>

          <div className="glass p-4 rounded-xl border border-primary/20">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
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
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  What happens next?
                </h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• You&apos;ll be added as a participant to the sweepstake</li>
                  <li>• The sweepstake will appear on your dashboard</li>
                  <li>• You&apos;ll be taken to the sweepstake details page</li>
                  <li>• Once the draw is complete, you&apos;ll be assigned teams</li>
                </ul>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-xl flex items-center space-x-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={joinMutation.isPending || !joinCode.trim()}
            className="w-full bg-gradient-to-r from-primary to-primary-600 text-white py-4 rounded-xl flex items-center justify-center space-x-2 hover:shadow-xl transition-all duration-300 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {joinMutation.isPending ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Joining...</span>
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
                <span>Join Sweepstake</span>
              </>
            )}
          </button>
        </form>
      </div>

      <div className="mt-6 glass p-6 rounded-2xl border border-white/20 dark:border-white/10">
        <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
          <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-primary text-sm">💡</span>
          </span>
          <span>Need Help?</span>
        </h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>
            <strong className="text-gray-900 dark:text-white">Don&apos;t have a code?</strong> Ask
            the sweepstake organizer to share their join code with you.
          </p>
          <p>
            <strong className="text-gray-900 dark:text-white">Code not working?</strong> Make sure
            you&apos;ve entered it correctly. Codes are not case-sensitive.
          </p>
          <p>
            <strong className="text-gray-900 dark:text-white">Want to create your own?</strong> Go
            back to the dashboard and click &quot;Create Sweepstake&quot;.
          </p>
        </div>
      </div>
    </div>
  );
}
