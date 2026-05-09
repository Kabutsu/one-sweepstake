interface Participant {
  id: string;
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  joinedAt: Date;
}

interface ParticipantsCardProps {
  participants: Participant[];
  maxParticipants: number;
  currentParticipants: number;
}

export default function ParticipantsCard({
  participants,
  maxParticipants,
  currentParticipants,
}: ParticipantsCardProps) {
  const progress = (currentParticipants / maxParticipants) * 100;

  return (
    <div className="glass p-6 shadow-xl rounded-2xl border border-white/20 dark:border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
          <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </span>
          <span>Participants</span>
        </h2>
        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
          {currentParticipants} / {maxParticipants}
        </span>
      </div>

      <div className="mb-4">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {maxParticipants - currentParticipants} spot
          {maxParticipants - currentParticipants !== 1 ? "s" : ""} remaining
        </p>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {participants.map((participant, index) => (
          <div
            key={participant.id}
            className="flex items-center space-x-3 p-3 bg-white/50 dark:bg-black/20 rounded-xl hover:bg-white/80 dark:hover:bg-black/30 transition-colors"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
              {participant.displayName?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white truncate">
                {participant.displayName || "Anonymous"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Joined {new Date(participant.joinedAt).toLocaleDateString()}
              </p>
            </div>
            {index === 0 && (
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-lg">
                Creator
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
