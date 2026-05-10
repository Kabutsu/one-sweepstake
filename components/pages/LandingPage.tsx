import { useState } from "react";
import { trpc } from "@/lib/trpc";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const sendMagicLink = trpc.auth.sendMagicLink.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await sendMagicLink.mutateAsync({ email });
      setSubmitted(true);
    } catch (error) {
      console.error("Failed to send magic link:", error);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background-light to-gray-100 dark:from-background-dark dark:to-gray-900">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        />
      </div>
        
        <div className="card max-w-md w-full p-8 animate-fade-in">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-primary rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4">Check your email</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We&apos;ve sent a sign-in link to <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 text-pretty">
              Click the link in the email to sign in. The link will expire in 30 minutes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background-light to-gray-100 dark:from-background-dark dark:to-gray-900">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        />
      </div>
      
      <div className="card max-w-md w-full p-8 animate-slide-up">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-primary">OneSweepstake</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Run football sweepstakes with your friends
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={sendMagicLink.isPending}
              className="input"
            />
          </div>

          {sendMagicLink.isError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
              Failed to send magic link. Please try again.
            </div>
          )}

          <button
            type="submit"
            disabled={sendMagicLink.isPending}
            className="btn-primary w-full flex items-center justify-center rounded-md"
          >
            {sendMagicLink.isPending ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Sending...</span>
              </>
            ) : (
              "Sign in with email"
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
          <p className="text-xs text-center text-gray-500">
            We&apos;ll send you a magic link to sign in. No password required.
          </p>
        </div>
      </div>
    </div>
  );
}
