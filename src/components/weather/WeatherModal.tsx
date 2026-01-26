import React from 'react';
import { useWeather, getWindDirection } from '@contexts/WeatherContext';

const WeatherModal: React.FC = () => {
  const {
    showWeatherModal,
    detailedWeather,
    weatherLoading,
    selectedCity,
    recommendation,
    setShowWeatherModal,
    fetchWeather,
  } = useWeather();

  if (!showWeatherModal || !detailedWeather) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200"
      onClick={() => setShowWeatherModal(false)}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/40 dark:to-blue-900/40 backdrop-blur-sm border-b border-sky-200 dark:border-sky-700 p-6 rounded-t-2xl z-10">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="text-6xl drop-shadow-lg">{detailedWeather.icon}</div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
                  {detailedWeather.temp}°C
                </h2>
                <p className="text-slate-600 dark:text-slate-400 font-medium">
                  {detailedWeather.desc}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-500 flex items-center gap-1 mt-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {selectedCity.name}, {selectedCity.state}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowWeatherModal(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
            >
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
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Feels Like Temperature */}
          <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-4 rounded-xl border border-orange-200 dark:border-orange-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-3xl">🌡️</div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                    Feels Like
                  </p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {detailedWeather.feelsLike.toFixed(1)}°C
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Weather Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Humidity */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-700/50">
              <div className="flex items-center gap-3">
                <div className="text-3xl">💧</div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Humidity</p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {detailedWeather.humidity}%
                  </p>
                </div>
              </div>
            </div>

            {/* Wind Speed */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-700/50">
              <div className="flex items-center gap-3">
                <div className="text-3xl">💨</div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                    Wind Speed
                  </p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {detailedWeather.windSpeed.toFixed(1)} km/h
                  </p>
                  <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                    {getWindDirection(detailedWeather.windDirection)}
                  </p>
                </div>
              </div>
            </div>

            {/* Pressure */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-700/50">
              <div className="flex items-center gap-3">
                <div className="text-3xl">🎚️</div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Pressure</p>
                  <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {detailedWeather.pressure.toFixed(0)} hPa
                  </p>
                </div>
              </div>
            </div>

            {/* UV Index */}
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-700/50">
              <div className="flex items-center gap-3">
                <div className="text-3xl">☀️</div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">UV Index</p>
                  <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                    {detailedWeather.uvIndex.toFixed(1)}
                  </p>
                  <p className="text-xs text-yellow-600/70 dark:text-yellow-400/70">
                    {detailedWeather.uvIndex < 3
                      ? 'Low'
                      : detailedWeather.uvIndex < 6
                        ? 'Moderate'
                        : detailedWeather.uvIndex < 8
                          ? 'High'
                          : 'Very High'}
                  </p>
                </div>
              </div>
            </div>

            {/* Precipitation */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-4 rounded-xl border border-indigo-200 dark:border-indigo-700/50">
              <div className="flex items-center gap-3">
                <div className="text-3xl">🌧️</div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                    Precipitation
                  </p>
                  <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                    {detailedWeather.precipitation.toFixed(1)} mm
                  </p>
                </div>
              </div>
            </div>

            {/* Visibility */}
            <div className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="text-3xl">👁️</div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                    Visibility
                  </p>
                  <p className="text-xl font-bold text-slate-600 dark:text-slate-400">
                    {detailedWeather.visibility} km
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Recommendation in Modal */}
          {recommendation && (
            <div className="bg-sky-100/50 dark:bg-sky-900/30 rounded-xl p-4 border border-sky-200 dark:border-sky-700/50">
              <h4 className="text-sm font-semibold text-sky-800 dark:text-sky-200 mb-3 flex items-center gap-2">
                <span className="text-xl">✨</span>
                <span>Weather Advice</span>
              </h4>
              <p className="text-sm text-sky-700 dark:text-sky-300 whitespace-pre-line leading-relaxed">
                {recommendation}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-4 rounded-b-2xl flex justify-end gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              fetchWeather();
            }}
            disabled={weatherLoading}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg
              className={`w-4 h-4 ${weatherLoading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
          <button
            onClick={() => setShowWeatherModal(false)}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default WeatherModal;
