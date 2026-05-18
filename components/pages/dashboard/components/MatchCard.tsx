import Image from "next/image";

interface MatchCardProps {
  homeTeamName: string;
  awayTeamName: string;
  homeTeamCrest?: string | null;
  awayTeamCrest?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  status: string;
  stage?: string | null;
  scheduledAt: Date;
}

function formatStage(stage?: string | null): string {
  if (!stage) return "";

  return stage
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

function formatMatchStatus(status: string, scheduledAt: Date): { label: string; isLive: boolean } {
  switch (status) {
    case "IN_PLAY":
      return { label: "● Live", isLive: true };
    case "PAUSED":
      return { label: "Half Time", isLive: true };
    case "SCHEDULED":
    case "TIMED":
      return {
        label: new Date(scheduledAt).toLocaleString("en-GB", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }),
        isLive: false,
      };
    case "FINISHED":
      return { label: "Full Time", isLive: false };
    default:
      return { label: status, isLive: false };
  }
}

function formatTeamName(name: string): string {
  return name.replace(/FC$/, "").trim();
}

export default function MatchCard({
  homeTeamName,
  awayTeamName,
  homeTeamCrest,
  awayTeamCrest,
  homeScore,
  awayScore,
  status,
  stage,
  scheduledAt,
}: MatchCardProps) {
  const { label: statusLabel, isLive } = formatMatchStatus(status, scheduledAt);
  const showScore = status === "IN_PLAY" || status === "PAUSED" || status === "FINISHED";
  const formattedStage = formatStage(stage);

  return (
    <div className="glass flex flex-col content-start gap-4 p-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 dark:border-white/10">
      <div className="flex items-center justify-between">
        <span
          className={`text-xs font-bold px-3 py-1.5 rounded-full shadow-md ${
            isLive
              ? "bg-red-600 text-white pulse-glow"
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
          }`}
        >
          {statusLabel}
        </span>
        {formattedStage && (
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-black/30 px-2 py-1 rounded">
            {formattedStage}
          </span>
        )}
      </div>

      <div className="flex flex-col flex-grow gap-3 justify-around">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {homeTeamCrest && (
              <Image
                src={homeTeamCrest}
                alt={`${homeTeamName} flag`}
                width={24}
                height={24}
                className="w-6 h-6 object-contain flex-shrink-0"
              />
            )}
            <span className="font-semibold text-gray-900 dark:text-white truncate">
              {formatTeamName(homeTeamName)}
            </span>
          </div>
          {showScore && (
            <span className="text-3xl font-black bg-gradient-to-br from-primary to-primary-600 bg-clip-text text-transparent ml-2">
              {homeScore ?? 0}
            </span>
          )}
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent"></div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {awayTeamCrest && (
              <Image
                src={awayTeamCrest}
                alt={`${awayTeamName} flag`}
                width={24}
                height={24}
                className="w-6 h-6 object-contain flex-shrink-0"
              />
            )}
            <span className="font-semibold text-gray-900 dark:text-white truncate">
              {formatTeamName(awayTeamName)}
            </span>
          </div>
          {showScore && (
            <span className="text-3xl font-black bg-gradient-to-br from-primary to-primary-600 bg-clip-text text-transparent ml-2">
              {awayScore ?? 0}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
