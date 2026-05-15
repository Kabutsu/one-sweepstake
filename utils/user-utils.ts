export function getInitials(name: string | null) {
  if (!name) return "🥸";

  const parts = name.trim().split(" ");
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  } else {
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
}

/**
 * Generates a user-friendly display name from an email address.
 * Example: "SamJamesLaw97@gmail.com" → "Sam James Law"
 */
export function generateDisplayNameFromEmail(email: string): string {
  // Extract the part before @
  const username = email.split("@")[0];

  // Remove numbers and special characters, replace with spaces
  let cleaned = username.replace(/[0-9_.-]/g, " ");

  // Add spaces before capital letters
  cleaned = cleaned.replace(/([A-Z])/g, " $1");

  // Split into words, capitalize each word, and join with spaces
  const words = cleaned
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

  // Join words and ensure it's not empty
  const result = words.join(" ").trim();
  return result || "User";
}
