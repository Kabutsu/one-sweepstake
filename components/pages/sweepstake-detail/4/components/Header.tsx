interface Sweepstake {
  name: string;
  tournamentName: string;
  maxParticipants: number;
  currentParticipants: number;
  drawCompletedAt: Date | null;
  isCreator: boolean;
}

interface HeaderProps {
  sweepstake: Sweepstake;
}

export default function Header({ sweepstake }: HeaderProps) {
  const progress = (sweepstake.currentParticipants / sweepstake.maxParticipants) * 100;

  return (
    <div className="glass p-6 shadow-xl rounded-2xl border border-white/20 dark:border-white/10">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-1 text-gray-900 dark:text-white">
            {sweepstake.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{sweepstake.tournamentName}</p>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className={`w-3 h-3 rounded-full ${sweepstake.drawCompletedAt ? "bg-green-500 animate-pulse" : "bg-yellow-500"}`}
          />
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
            {sweepstake.drawCompletedAt ? "Active" : "Pending"}
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500 dark:text-gray-400">Participants</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {sweepstake.currentParticipants}/{sweepstake.maxParticipants}
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        {sweepstake.isCreator && (
          <span className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-lg whitespace-nowrap">
            CREATOR
          </span>
        )}
      </div>
    </div>
  );
}
