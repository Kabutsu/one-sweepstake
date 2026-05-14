import { useState } from "react";

interface GroupStanding {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  group: string;
}

interface GroupStandingsTableProps {
  standings: Record<string, GroupStanding[]>;
}

export default function GroupStandingsTable({ standings }: GroupStandingsTableProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(Object.keys(standings).slice(0, 2)) // Expand first 2 groups by default
  );

  const toggleGroup = (group: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(group)) {
      newExpanded.delete(group);
    } else {
      newExpanded.add(group);
    }
    setExpandedGroups(newExpanded);
  };

  const groups = Object.keys(standings).sort();

  if (groups.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-pretty">
        <p>Group standings will appear once matches begin</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const isExpanded = expandedGroups.has(group);
        const groupStandings = standings[group];

        return (
          <div
            key={group}
            className="bg-white dark:bg-black/30 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Group Header */}
            <button
              onClick={() => toggleGroup(group)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center text-white font-bold text-sm">
                  {group}
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">Group {group}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {groupStandings.length} teams
                </span>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Group Table */}
            {isExpanded && (
              <div className="border-t border-gray-200 dark:border-gray-700">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-600 dark:text-gray-400 uppercase">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold">#</th>
                        <th className="px-4 py-2 text-left font-semibold">Team</th>
                        <th className="px-2 py-2 text-center font-semibold">P</th>
                        <th className="px-2 py-2 text-center font-semibold">W</th>
                        <th className="px-2 py-2 text-center font-semibold">D</th>
                        <th className="px-2 py-2 text-center font-semibold">L</th>
                        <th className="px-2 py-2 text-center font-semibold">GD</th>
                        <th className="px-2 py-2 text-center font-semibold">Pts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {groupStandings.map((team, index) => {
                        const position = index + 1;
                        const isQualified = position <= 2;
                        const isThirdPlace = position === 3;

                        return (
                          <tr
                            key={team.teamId}
                            className={`
                              ${isQualified ? "bg-green-50 dark:bg-green-900/10" : ""}
                              ${isThirdPlace ? "bg-yellow-50 dark:bg-yellow-900/10" : ""}
                              hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors
                            `}
                          >
                            <td className="px-4 py-3">
                              <div
                                className={`
                                  w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                                  ${isQualified ? "bg-green-500 text-white" : ""}
                                  ${isThirdPlace ? "bg-yellow-500 text-white" : ""}
                                  ${!isQualified && !isThirdPlace ? "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400" : ""}
                                `}
                              >
                                {position}
                              </div>
                            </td>
                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                              {team.teamName}
                            </td>
                            <td className="px-2 py-3 text-center text-gray-600 dark:text-gray-400">
                              {team.played}
                            </td>
                            <td className="px-2 py-3 text-center text-gray-600 dark:text-gray-400">
                              {team.won}
                            </td>
                            <td className="px-2 py-3 text-center text-gray-600 dark:text-gray-400">
                              {team.drawn}
                            </td>
                            <td className="px-2 py-3 text-center text-gray-600 dark:text-gray-400">
                              {team.lost}
                            </td>
                            <td
                              className={`
                                px-2 py-3 text-center font-semibold
                                ${team.goalDifference > 0 ? "text-green-600 dark:text-green-400" : ""}
                                ${team.goalDifference < 0 ? "text-red-600 dark:text-red-400" : ""}
                                ${team.goalDifference === 0 ? "text-gray-600 dark:text-gray-400" : ""}
                              `}
                            >
                              {team.goalDifference > 0 ? "+" : ""}
                              {team.goalDifference}
                            </td>
                            <td className="px-2 py-3 text-center font-bold text-gray-900 dark:text-white">
                              {team.points}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Legend */}
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <span className="text-gray-600 dark:text-gray-400">Qualified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                    <span className="text-gray-600 dark:text-gray-400">3rd (best 8 advance)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
