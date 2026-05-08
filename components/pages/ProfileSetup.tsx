import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function ProfileSetup() {
  const [displayName, setDisplayName] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const navigate = useNavigate();
  const setupProfile = trpc.auth.setupProfile.useMutation();
  const utils = trpc.useUtils();

  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDisplayName(value);
    setValidationError(null); // Clear validation error on input change
  };

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      // Handle tRPC errors with specific messages
      if (error.message.includes("already taken")) {
        return "This display name is already taken. Please choose another one.";
      }
      if (error.message.includes("minimum")) {
        return "Display name must be at least 1 character.";
      }
      if (error.message.includes("maximum")) {
        return "Display name must not exceed 50 characters.";
      }
      return error.message;
    }
    return "Failed to save profile. Please try again.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmed = displayName.trim();

    if (!trimmed) {
      setValidationError("Display name is required.");
      return;
    }

    if (trimmed.length > 50) {
      setValidationError("Display name must not exceed 50 characters.");
      return;
    }

    try {
      await setupProfile.mutateAsync({ displayName: trimmed });
      utils.auth.me.invalidate();
      navigate("/dashboard");
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setValidationError(errorMessage);
    }
  };

  const error = validationError || (setupProfile.isError ? "Failed to save profile. Please try again." : null);
  const displayNameLength = displayName.length;
  const isButtonDisabled = setupProfile.isPending || !displayName.trim();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background-light to-gray-100 dark:from-background-dark dark:to-gray-900">
      <div className="card max-w-md w-full p-8 animate-slide-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 text-text-light dark:text-text-dark">Welcome!</h1>
          <p className="text-gray-600 dark:text-gray-400">Let's set up your profile</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="displayName" className="block text-sm font-semibold mb-3 text-text-light dark:text-text-dark">
              Display name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={handleDisplayNameChange}
              placeholder="How should your friends see you?"
              required
              minLength={1}
              maxLength={50}
              disabled={setupProfile.isPending}
              className="input"
              autoFocus
            />
            <div className="flex justify-between items-start mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This is how you'll appear to other participants
              </p>
              <span className={`text-xs font-medium ${displayNameLength > 45 ? "text-orange-600 dark:text-orange-400" : "text-gray-500 dark:text-gray-400"}`}>
                {displayNameLength}/50
              </span>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isButtonDisabled}
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

