import { MockSweepstake } from "@/mocks/dashboardData";

interface SweepstakeTileProps {
  sweepstake: MockSweepstake;
}

export default function SweepstakeTile({ sweepstake }: SweepstakeTileProps) {
  const isDrawComplete = sweepstake.drawCompletedAt !== null;

  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 p-4 hover:border-primary transition-colors cursor-pointer group">
      <div className="flex justify-between items-start mb-3">
        <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
             style={{ backgroundColor: isDrawComplete ? "#107C11" : "#EAB308" }}></div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {sweepstake.currentParticipants}/{sweepstake.maxParticipants}
        </span>
      </div>
      <h3 className="font-bold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
        {sweepstake.name}
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {isDrawComplete ? "Active" : "Pending draw"}
      </p>
    </div>
  );
}
