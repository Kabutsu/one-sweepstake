interface Participant {
  id: string;
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  joinedAt: Date;
}

interface ParticipantsWidgetProps {
  participants: Participant[];
  maxParticipants: number;
  currentParticipants: number;
}

export default function ParticipantsWidget({
  participants,
  maxParticipants,
  currentParticipants,
}: ParticipantsWidgetProps) {
  return (
    <div className="glass p-5 shadow-xl rounded-2xl border border-white/20 dark:border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
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
          </div>
          <h3 className="font-bold text-sm text-gray-900 dark:text-white">Participants</h3>
        </div>
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          {currentParticipants}/{maxParticipants}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {participants.map((participant, index) => (
          <div
            key={participant.id}
            className="bg-white/50 dark:bg-black/20 p-3 rounded-xl text-center hover:bg-white/80 dark:hover:bg-black/30 transition-colors"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-2">
              {participant.displayName?.[0]?.toUpperCase() || "?"}
            </div>
            <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
              {participant.displayName || "Anonymous"}
            </p>
            {index === 0 && <span className="text-[10px] text-primary font-bold">Creator</span>}
          </div>
        ))}

        {Array.from({ length: maxParticipants - currentParticipants }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="bg-white/30 dark:bg-black/10 p-3 rounded-xl text-center border border-dashed border-gray-300 dark:border-gray-700"
          >
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-2">
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
            <p className="text-xs text-gray-400 dark:text-gray-600">Open</p>
          </div>
        ))}
      </div>
    </div>
  );
}
