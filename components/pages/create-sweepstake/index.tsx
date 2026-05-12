import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function CreateSweepstake() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(32);
  const [error, setError] = useState("");

  const { data: tournament, isLoading: tournamentLoading } =
    trpc.sweepstakes.getActiveTournament.useQuery();

  const createMutation = trpc.sweepstakes.createSweepstake.useMutation({
    onSuccess: (data) => {
      navigate(`/sweepstake/${data.id}`);
    },
    onError: (err) => {
      setError(err.message || "Failed to create sweepstake");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter a sweepstake name");
      return;
    }

    if (maxParticipants < 2 || maxParticipants > 48) {
      setError("Max participants must be between 2 and 48");
      return;
    }

    if (!tournament) {
      setError("No active tournament found");
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      maxParticipants,
      tournamentId: tournament.id,
    });
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (tournamentLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="glass p-8 rounded-2xl max-w-md text-center">
          <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
            No Active Tournament
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            There is no active tournament available at the moment.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => navigate("/dashboard")}
        className="mb-4 text-gray-600 dark:text-gray-400 hover:text-primary flex items-center space-x-2 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span>Back to Dashboard</span>
      </button>

      <div className="glass p-8 shadow-2xl rounded-2xl border border-white/20 dark:border-white/10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
            Create Sweepstake
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Set up a new sweepstake for {tournament.name}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 items-start grid-cols-1 sm:grid-cols-2">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-semibold mb-2 text-gray-900 dark:text-white"
              >
                Sweepstake Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Office World Cup 2026"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                maxLength={100}
                disabled={createMutation.isPending}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Give your sweepstake a memorable name
              </p>
            </div>

            <div>
              <label
                htmlFor="maxParticipants"
                className="block text-sm font-semibold mb-2 text-gray-900 dark:text-white"
              >
                Maximum Participants
              </label>
              <div className="relative">
                <input
                  id="maxParticipants"
                  type="number"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(parseInt(e.target.value) || 0)}
                  min={2}
                  max={48}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  disabled={createMutation.isPending}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Between 2 and 48 participants (there are 48 teams in the tournament)
              </p>
            </div>
          </div>

          <div className="glass p-4 rounded-xl border border-primary/20">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
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
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  What happens next?
                </h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• You&apos;ll receive a unique join code to share with participants</li>
                  <li>• You&apos;ll be added as the first participant automatically</li>
                  <li>• Others can join using the code until the sweepstake is full</li>
                  <li>• Once everyone has joined, you can perform the team draw</li>
                </ul>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-xl flex items-center space-x-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={
              createMutation.isPending ||
              !name.trim() ||
              maxParticipants < 2 ||
              maxParticipants > 48
            }
            className="w-full bg-gradient-to-r from-primary to-primary-600 text-white py-4 rounded-xl flex items-center justify-center space-x-2 hover:shadow-xl transition-all duration-300 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <span>Create Sweepstake</span>
              </>
            )}
          </button>
        </form>
      </div>

      <div className="mt-6 glass p-6 rounded-2xl border border-white/20 dark:border-white/10">
        <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
          <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-primary text-sm">⚽</span>
          </span>
          <span>Tournament Info</span>
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 dark:text-gray-400 mb-1">Tournament</p>
            <p className="font-semibold text-gray-900 dark:text-white">{tournament.name}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 mb-1">Total Teams</p>
            <p className="font-semibold text-gray-900 dark:text-white">{tournament.teamCount}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 mb-1">Start Date</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {new Date(tournament.startDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 mb-1">End Date</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {new Date(tournament.endDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
