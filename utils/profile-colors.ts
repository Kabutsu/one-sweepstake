/**
 * Generate a consistent color gradient for a user based on their ID or name
 * To revert to a static gradient, change this function to return a fixed color like:
 * return "from-primary to-primary-600"
 */
export function getProfileGradient(userId: string | null, displayName: string | null): string {
  // Fallback to static gradient if no identifiers
  if (!userId && !displayName) {
    return "from-primary to-primary-600";
  }

  // Use userId preferentially, fall back to displayName
  const seed = userId || displayName || "";

  // Simple hash function to generate consistent colors
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Color palette with good contrast and variety
  const gradients = [
    "from-blue-500 to-indigo-500",
    "from-purple-500 to-pink-500",
    "from-green-500 to-emerald-500",
    "from-orange-500 to-red-500",
    "from-cyan-500 to-blue-500",
    "from-violet-500 to-purple-500",
    "from-rose-500 to-pink-500",
    "from-teal-500 to-cyan-500",
    "from-amber-500 to-orange-500",
    "from-indigo-500 to-blue-500",
  ];

  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}
