import { MockSweepstake } from "@/mocks/dashboardData";

interface SweepstakeCardProps {
  sweepstake: MockSweepstake;
}

export default function SweepstakeCard({ sweepstake }: SweepstakeCardProps) {
  const isDrawComplete = sweepstake.drawCompletedAt !== null;
  const participantPercentage = (sweepstake.currentParticipants / sweepstake.maxParticipants) * 100;

  return (
    <div className="card p-6 hover:shadow-xl transition-shadow cursor-pointer group">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors">
            {sweepstake.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{sweepstake.tournamentName}</p>
        </div>
        {isDrawComplete ? (
          <span className="bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">
            Active
          </span>
        ) : (
          <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs font-semibold px-3 py-1 rounded-full">
            Pending
          </span>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">Participants</span>
            <span className="font-semibold">
              {sweepstake.currentParticipants} / {sweepstake.maxParticipants}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${participantPercentage}%` }}
            />
          </div>
        </div>

        {!isDrawComplete && (
          <div className="pt-2 border-t-2 border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Waiting for draw to begin
            </p>
            <button className="w-full btn-secondary text-sm py-2">View Details</button>
          </div>
        )}

        {isDrawComplete && (
          <div className="pt-2 border-t-2 border-gray-100 dark:border-gray-800">
            <button className="w-full btn-primary text-sm py-2">View Sweepstake</button>
          </div>
        )}
      </div>
    </div>
  );
}
