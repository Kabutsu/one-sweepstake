import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ProfileCircle from "@/components/ui/ProfileCircle";

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { data: currentUser, isLoading: isLoadingUser } = trpc.auth.me.useQuery();
  const [displayName, setDisplayName] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const setupProfile = trpc.auth.setupProfile.useMutation();
  const getUploadUrl = trpc.auth.getUploadUrl.useMutation();
  const utils = trpc.useUtils();

  // // Pre-populate display name with the default generated name
  // useState(() => {
  //   if (currentUser?.displayName) {
  //     setDisplayName(currentUser.displayName);
  //   }
  // });

  // // Update display name when user data loads
  // if (currentUser?.displayName && displayName === "" && !isLoadingUser) {
  //   setDisplayName(currentUser.displayName);
  // }

  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDisplayName(value);
    setValidationError(null); // Clear validation error on input change
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);

    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Please select a JPG, PNG, or WebP image.");
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    // Validate file size (1MB max)
    const maxSize = 1 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError("Image must be smaller than 1MB.");
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
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
    setUploadError(null);

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
      let avatarUrl: string | undefined;

      // Upload image if selected
      if (selectedFile) {
        try {
          // Get signed upload URL
          const { uploadUrl, filePath } = await getUploadUrl.mutateAsync();

          // Upload file to Supabase Storage
          const uploadResponse = await fetch(uploadUrl, {
            method: "PUT",
            body: selectedFile,
            headers: {
              "Content-Type": selectedFile.type,
              "x-upsert": "true",
            },
          });

          if (!uploadResponse.ok) {
            throw new Error("Failed to upload image");
          }

          // Generate public URL
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          avatarUrl = `${supabaseUrl}/storage/v1/object/public/profile-images/${filePath}`;
        } catch (uploadErr) {
          setUploadError("Failed to upload image. Please try again.");
          return;
        }
      }

      await setupProfile.mutateAsync({ displayName: trimmed, avatarUrl });
      utils.auth.me.invalidate();
      navigate("/dashboard");
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setValidationError(errorMessage);
    }
  };

  const error =
    validationError ||
    uploadError ||
    (setupProfile.isError ? "Failed to save profile. Please try again." : null);
  const displayNameLength = displayName.length;
  const isButtonDisabled = setupProfile.isPending || getUploadUrl.isPending || !displayName.trim();

  // Show loading spinner while fetching user data
  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background-light to-gray-100 dark:from-background-dark dark:to-gray-900">
      <div className="card max-w-md w-full p-8 animate-slide-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 text-text-light dark:text-text-dark">Welcome!</h1>
          <p className="text-gray-600 dark:text-gray-400">Let&apos;s set up your profile</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center space-y-3">
            <div className="relative">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Profile preview"
                  className="w-24 h-24 rounded-full object-cover border-4 border-primary-200 dark:border-primary-800"
                />
              ) : (
                <ProfileCircle displayName={displayName || null} userId={null} size="xl" />
              )}
            </div>
            <label
              htmlFor="avatar"
              className="cursor-pointer text-sm text-primary hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors"
            >
              {previewUrl ? "Change photo" : "Add profile photo (optional)"}
            </label>
            <input
              id="avatar"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileChange}
              disabled={setupProfile.isPending || getUploadUrl.isPending}
              className="hidden"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              JPG, PNG, or WebP • Max 1MB • This can only be set once
            </p>
          </div>

          <div>
            <label
              htmlFor="displayName"
              className="block text-sm font-semibold mb-3 text-text-light dark:text-text-dark"
            >
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
              disabled={setupProfile.isPending || getUploadUrl.isPending}
              className="input"
              autoFocus
            />
            <div className="flex justify-between items-start mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This is how you&apos;ll appear to other participants
              </p>
              <span
                className={`text-xs font-medium ${displayNameLength > 45 ? "text-orange-600 dark:text-orange-400" : "text-gray-500 dark:text-gray-400"}`}
              >
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
            {setupProfile.isPending || getUploadUrl.isPending ? (
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
