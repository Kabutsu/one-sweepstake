interface Sweepstake {
  name: string;
  tournamentName: string;
  isCreator: boolean;
  drawCompletedAt: Date | null;
}

interface TitleWidgetProps {
  sweepstake: Sweepstake;
}

export default function TitleWidget({ sweepstake }: TitleWidgetProps) {
  return (
    <div className="glass p-6 shadow-xl rounded-2xl border border-white/20 dark:border-white/10">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black mb-1 text-gray-900 dark:text-white">
            {sweepstake.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{sweepstake.tournamentName}</p>
        </div>
        <div className="flex items-center space-x-2">
          {sweepstake.isCreator && (
            <span className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-lg">
              CREATOR
            </span>
          )}
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-white/50 dark:bg-black/20 rounded-lg">
            <span
              className={`w-2 h-2 rounded-full ${sweepstake.drawCompletedAt ? "bg-green-500 animate-pulse" : "bg-yellow-500"}`}
            />
            <span className="text-xs font-semibold text-gray-900 dark:text-white">
              {sweepstake.drawCompletedAt ? "Active" : "Pending"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
