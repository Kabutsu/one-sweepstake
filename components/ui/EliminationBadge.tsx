interface EliminationBadgeProps {
  isEliminated: boolean;
  variant?: "badge" | "inline";
  size?: "sm" | "md";
}

/**
 * Modern elimination indicator component
 * Shows elimination status with animated styling
 */
export default function EliminationBadge({
  isEliminated,
  variant = "badge",
  size = "md",
}: EliminationBadgeProps) {
  if (!isEliminated) return null;

  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5",
    md: "text-xs px-2 py-1",
  };

  if (variant === "inline") {
    return (
      <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-[10px] uppercase tracking-wide">Eliminated</span>
      </span>
    );
  }

  return (
    <span
      className={`
        ${sizeClasses[size]}
        inline-flex items-center gap-1
        bg-red-100 dark:bg-red-900/30
        text-red-700 dark:text-red-300
        rounded-md font-semibold uppercase tracking-wide
        border border-red-200 dark:border-red-800
        animate-in fade-in duration-300
      `}
    >
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
      <span>Out</span>
    </span>
  );
}
