import React from 'react';
import { UserStats } from '@/services/locationAnalyticsService';

interface MyStatsModalProps {
  stats: UserStats | null;
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
}

const MyStatsModal: React.FC<MyStatsModalProps> = ({
  stats,
  isOpen,
  onClose,
  isLoading,
  // hasConsent removed
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg transform transition-all animate-fadeIn overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-900 dark:to-indigo-900 text-white flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span>📊</span> My Campus Stats
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              Your detailed activity report for the last 30 days
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500 dark:text-slate-400">Calculating your stats...</p>
            </div>
          ) : !stats || stats.totalVisits === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <p className="text-4xl mb-3">📉</p>
              <p className="text-lg font-medium text-slate-900 dark:text-white mb-1">
                No activity yet
              </p>
              <p>We haven't recorded any campus visits for you in the last 30 days.</p>
              <p className="text-xs mt-4 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 p-3 rounded-lg">
                Tip: Visit campus locations to start building your profile!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">
                    Total Visits
                  </p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {stats.totalVisits}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">
                    Unique Places
                  </p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {stats.uniqueZones}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">
                    Total Time
                  </p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {stats.totalTimeMinutes < 60
                      ? `${stats.totalTimeMinutes}m`
                      : `${Math.floor(stats.totalTimeMinutes / 60)}h ${stats.totalTimeMinutes % 60}m`}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">
                    Avg. Stay
                  </p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {stats.avgDwellTime}m
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">
                    Favorite Spot
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-1 leading-tight truncate">
                    {stats.favoriteZone}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">
                    Top Category
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-1 capitalize">
                    {stats.favoriteCategory}
                  </p>
                </div>
              </div>

              {/* Top Places List */}
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-3">
                  Top Places Visited
                </h3>
                <div className="space-y-2">
                  {stats.topZones.map((zone, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-white dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                            idx === 0
                              ? 'bg-yellow-100 text-yellow-700'
                              : idx === 1
                                ? 'bg-slate-200 text-slate-700'
                                : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {zone.name}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {zone.visits} visits
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Badges / Gamification (Placeholder) */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-xl border border-purple-100 dark:border-purple-800">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <p className="font-bold text-purple-900 dark:text-purple-300">
                      Campus Explorer Level
                    </p>
                    <p className="text-xs text-purple-700 dark:text-purple-400">
                      You've visited {stats.topZones.length} unique locations!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyStatsModal;
