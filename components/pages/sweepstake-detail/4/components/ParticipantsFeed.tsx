interface Participant {
  id: string;
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  joinedAt: Date;
}

interface ParticipantsFeedProps {
  participants: Participant[];
  maxParticipants: number;
  currentParticipants: number;
}

export default function ParticipantsFeed({
  participants,
  maxParticipants,
  currentParticipants,
}: ParticipantsFeedProps) {
  const openSpots = maxParticipants - currentParticipants;

  return (
    <div className="glass p-6 shadow-xl rounded-2xl border border-white/20 dark:border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <svg
              className="w-6 h-6 text-primary"
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
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Participants</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {openSpots} spot{openSpots !== 1 ? "s" : ""} remaining
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {participants.map((participant, index) => (
          <div
            key={participant.id}
            className="flex items-center space-x-3 p-3 bg-white/50 dark:bg-black/20 rounded-xl"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
              {participant.displayName?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white truncate">
                {participant.displayName || "Anonymous"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {index === 0
                  ? "Creator"
                  : `Joined ${new Date(participant.joinedAt).toLocaleDateString()}`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
