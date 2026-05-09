interface Participant {
  id: string;
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  joinedAt: Date;
}

interface ParticipantsListProps {
  participants: Participant[];
  maxParticipants: number;
  currentParticipants: number;
}

export default function ParticipantsList({
  participants,
  maxParticipants,
  currentParticipants,
}: ParticipantsListProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Participants</h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {currentParticipants} of {maxParticipants}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {participants.map((participant, index) => (
          <div
            key={participant.id}
            className="bg-white/50 dark:bg-black/20 p-4 rounded-xl hover:bg-white/80 dark:hover:bg-black/30 transition-all group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
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
          </div>
        ))}

        {/* Empty slots */}
        {Array.from({ length: maxParticipants - currentParticipants }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="bg-white/30 dark:bg-black/10 p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700"
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-400 dark:text-gray-600">Open Slot</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
