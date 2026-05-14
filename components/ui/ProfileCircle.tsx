import Image from "next/image";
import { getInitials } from "@/utils/user-utils";
import { getProfileGradient } from "@/utils/profile-colors";

interface ProfileCircleProps {
  avatarUrl?: string | null;
  displayName: string | null;
  userId?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  showRank?: number;
  grayscale?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "w-6 h-6 text-xs",
  md: "w-8 h-8 text-sm",
  lg: "w-10 h-10 text-base",
  xl: "w-12 h-12 text-lg",
};

export default function ProfileCircle({
  avatarUrl,
  displayName,
  userId,
  size = "md",
  showRank,
  grayscale = false,
  className = "",
}: ProfileCircleProps) {
  const gradient = getProfileGradient(userId || null, displayName);
  const initials = getInitials(displayName);

  // If showing a rank badge, render just the rank badge
  if (showRank !== undefined) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-primary-300 to-primary-500 flex items-center justify-center text-white font-bold ${grayscale ? "grayscale" : ""} ${className}`}
      >
        #{showRank}
      </div>
    );
  }

  // Regular avatar display
  if (avatarUrl) {
    return (
      <div className={`relative ${sizeClasses[size]} ${className}`}>
        <Image
          src={avatarUrl}
          alt={displayName || "User"}
          fill
          className={`rounded-full object-cover ${grayscale ? "grayscale" : ""}`}
          onError={(e) => {
            // On error, hide the image and show the fallback initials
            e.currentTarget.style.display = "none";
          }}
        />
        {/* Fallback initials if image fails to load */}
        <div
          className={`absolute inset-0 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-semibold ${grayscale ? "grayscale" : ""}`}
          style={{ display: "none" }}
        >
          {initials}
        </div>
      </div>
    );
  }

  // Fallback to initials
  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-semibold ${grayscale ? "grayscale" : ""} ${className}`}
    >
      {initials}
    </div>
  );
}
