import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function AuthVerify() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const verifyMagicLink = trpc.auth.verifyMagicLink.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    // Supabase puts auth data in the URL hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const token = hashParams.get("access_token");
    const type = hashParams.get("type");

    // Extract email from the JWT token (it's in the payload)
    let email = "";
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        email = payload.email;
      } catch {
        setError("Invalid token format");
        return;
      }
    }

    if (!token || !email) {
      setError("Missing verification token or email");
      return;
    }

    if (type !== "magiclink") {
      setError("Invalid authentication type");
      return;
    }

    verifyMagicLink
      .mutateAsync({ token, email })
      .then(async (result) => {
        // Refetch all queries to clear stale auth-dependent data
        await Promise.all([
          utils.auth.me.refetch(),
          utils.sweepstakes.getUserSweepstakes.refetch(),
          utils.sweepstakes.getActiveTournament.refetch(),
        ]).catch(() => {
          // Ignore refetch errors and continue
        });

        // Clear the URL hash to prevent accidental re-verification on refresh
        window.history.replaceState({}, document.title, window.location.pathname);

        // Navigate based on whether profile is complete
        if (result.isNewUser || !result.user.displayName) {
          navigate("/auth/setup");
        } else {
          navigate("/dashboard");
        }
      })
      .catch((err) => {
        setError(err.message || "Invalid or expired link");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-md w-full p-8 animate-fade-in">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4">Verification failed</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <button onClick={() => navigate("/")} className="btn-primary">
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Verifying your email...</p>
      </div>
    </div>
  );
}
