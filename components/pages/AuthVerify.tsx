import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function AuthVerify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const verifyMagicLink = trpc.auth.verifyMagicLink.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    // Supabase puts the token in query params or hash
    const token =
      searchParams.get("token") || window.location.hash.split("access_token=")[1]?.split("&")[0];
    const email = searchParams.get("email");
    const type = searchParams.get("type");

    // For Supabase email OTP, we need both token and type=email
    if (!token || type !== "email") {
      setError("Missing or invalid verification token");
      return;
    }

    if (!email) {
      setError("Missing email address");
      return;
    }

    verifyMagicLink
      .mutateAsync({ token, email })
      .then((result) => {
        utils.auth.me.invalidate();
        if (result.isNewUser) {
          navigate("/auth/setup");
        } else {
          navigate("/dashboard");
        }
      })
      .catch((err) => {
        setError(err.message || "Invalid or expired link");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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
