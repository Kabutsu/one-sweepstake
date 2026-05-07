import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function ProfileSetup() {
  const [displayName, setDisplayName] = useState("");
  const navigate = useNavigate();
  const setupProfile = trpc.auth.setupProfile.useMutation();
  const utils = trpc.useUtils();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await setupProfile.mutateAsync({ displayName });
      utils.auth.me.invalidate();
      navigate("/dashboard");
    } catch (error) {
      console.error("Failed to setup profile:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background-light to-gray-100 dark:from-background-dark dark:to-gray-900">
      <div className="card max-w-md w-full p-8 animate-slide-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome!</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Let's set up your profile
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium mb-2">
              Display name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How should your friends see you?"
              required
              minLength={1}
              maxLength={50}
              disabled={setupProfile.isPending}
              className="input"
            />
            <p className="mt-2 text-xs text-gray-500">
              This is how you'll appear to other participants
            </p>
          </div>

          {setupProfile.isError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
              Failed to save profile. Please try again.
            </div>
          )}

          <button
            type="submit"
            disabled={setupProfile.isPending || !displayName.trim()}
            className="btn-primary w-full flex items-center justify-center"
          >
            {setupProfile.isPending ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Saving...</span>
              </>
            ) : (
              "Continue"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
