import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

type AuthStep = "email" | "code" | "verifying";

export default function LandingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const sendOtpCode = trpc.auth.sendOtpCode.useMutation();
  const verifyOtpCode = trpc.auth.verifyOtpCode.useMutation();
  const utils = trpc.useUtils();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await sendOtpCode.mutateAsync({ email });
      setStep("code");
      setCode(""); // Clear code field
    } catch (error) {
      console.error("Failed to send verification code:", error);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep("verifying");

    try {
      const result = await verifyOtpCode.mutateAsync({ email, code });

      // Refetch user data
      await utils.auth.me.refetch();

      // Navigate based on profile completeness
      if (result.isNewUser || !result.user.displayName) {
        navigate("/auth/setup");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Failed to verify code:", error);
      setStep("code"); // Go back to code entry on error
    }
  };

  const handleResend = async () => {
    try {
      await sendOtpCode.mutateAsync({ email });
      setCode(""); // Clear code field
    } catch (error) {
      console.error("Failed to resend code:", error);
    }
  };

  const handleBackToEmail = () => {
    setStep("email");
    setCode("");
    sendOtpCode.reset();
    verifyOtpCode.reset();
  };

  // Email entry step
  if (step === "email") {
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

          <form onSubmit={handleEmailSubmit} className="space-y-6">
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
                disabled={sendOtpCode.isPending}
                className="input"
                autoComplete="email"
                autoFocus
              />
            </div>

            {sendOtpCode.isError && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
                Failed to send verification code. Please try again.
              </div>
            )}

            <button
              type="submit"
              disabled={sendOtpCode.isPending}
              className="btn-primary w-full flex items-center justify-center rounded-md"
            >
              {sendOtpCode.isPending ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Sending…</span>
                </>
              ) : (
                "Continue with Email"
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
            <p className="text-xs text-center text-gray-500">
              We&apos;ll send you a 6-digit code to verify your email. No password required.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Code entry or verifying step
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
        {step === "verifying" ? (
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">Verifying your code…</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-6 bg-primary rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">Check your email</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-2">We sent a 6-digit code to</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{email}</p>
            </div>

            <form onSubmit={handleCodeSubmit} className="space-y-6">
              <div>
                <label htmlFor="code" className="block text-sm font-medium mb-2">
                  Verification code
                </label>
                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  required
                  maxLength={6}
                  disabled={verifyOtpCode.isPending}
                  className="input text-center text-2xl tracking-widest font-mono"
                  autoComplete="one-time-code"
                  spellCheck={false}
                  autoFocus
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                  Enter the 6-digit code from your email
                </p>
              </div>

              {verifyOtpCode.isError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
                  Invalid or expired code. Please try again or request a new code.
                </div>
              )}

              <button
                type="submit"
                disabled={verifyOtpCode.isPending || code.length !== 6}
                className="btn-primary w-full flex items-center justify-center rounded-md"
              >
                {verifyOtpCode.isPending ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Verifying…</span>
                  </>
                ) : (
                  "Verify Code"
                )}
              </button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <button
                type="button"
                onClick={handleResend}
                disabled={sendOtpCode.isPending}
                className="text-sm text-primary hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors disabled:opacity-50"
              >
                {sendOtpCode.isPending ? "Sending…" : "Resend code"}
              </button>
              <div>
                <button
                  type="button"
                  onClick={handleBackToEmail}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  Use a different email
                </button>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
              <p className="text-xs text-center text-gray-500">
                The code expires in 1 hour. Check your spam folder if you don&apos;t see it.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
