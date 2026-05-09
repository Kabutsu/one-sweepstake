import { MockSweepstake } from "@/mocks/dashboardData";

interface SweepstakeTileProps {
  sweepstake: MockSweepstake;
}

export default function SweepstakeTile({ sweepstake }: SweepstakeTileProps) {
  const isDrawComplete = sweepstake.drawCompletedAt !== null;

  return (
    <div className="glass p-4 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:scale-[1.02] border border-white/20 dark:border-white/10">
      <div className="flex justify-between items-start mb-3">
        <div
          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 shadow-lg transition-all duration-300 ${isDrawComplete ? "bg-primary shadow-primary/50 group-hover:shadow-primary group-hover:scale-110" : "bg-yellow-500 shadow-yellow-500/50 group-hover:shadow-yellow-500 group-hover:scale-110"}`}
        ></div>
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-black/30 px-2 py-1 rounded-full">
          {sweepstake.currentParticipants}/{sweepstake.maxParticipants}
        </span>
      </div>
      <h3 className="font-bold text-sm mb-2 line-clamp-2 text-gray-900 dark:text-white group-hover:text-primary transition-colors">
        {sweepstake.name}
      </h3>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
        {isDrawComplete ? "Active" : "Pending draw"}
      </p>
    </div>
  );
}
