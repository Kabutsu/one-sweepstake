import { getInitials } from "@/utils/user-utils";

interface Participant {
  id: string;
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  joinedAt: Date;
}

interface Sweepstake {
  participants: Participant[];
  maxParticipants: number;
  currentParticipants: number;
}

interface ParticipantsTabProps {
  sweepstake: Sweepstake;
}

export default function ParticipantsTab({ sweepstake }: ParticipantsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">All Participants</h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {sweepstake.currentParticipants} / {sweepstake.maxParticipants}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sweepstake.participants.map((participant, index) => (
          <div
            key={participant.id}
            className="flex items-center space-x-4 p-4 bg-white/50 dark:bg-black/20 rounded-xl hover:bg-white/80 dark:hover:bg-black/30 transition-colors"
          >
            <div className="flex items-center space-x-3 flex-1">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {getInitials(participant.displayName)}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {participant.displayName || "Anonymous"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Joined {new Date(participant.joinedAt).toLocaleDateString("en-GB")}
                </p>
              </div>
            </div>
            {index === 0 && (
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-lg">
                CREATOR
              </span>
            )}
          </div>
        ))}

        {Array.from({ length: sweepstake.maxParticipants - sweepstake.currentParticipants }).map(
          (_, index) => (
            <div
              key={`empty-${index}`}
              className="flex items-center space-x-4 p-4 bg-white/30 dark:bg-black/10 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center">
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
                <div>
                  <p className="text-sm text-gray-400 dark:text-gray-600">
                    Waiting for participant
                  </p>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
