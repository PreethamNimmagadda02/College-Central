import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CalendarEvent } from '@/types';
import { getEventEmoji } from '@lib/utils/eventUtils';

interface CountdownPillProps {
  events: CalendarEvent[];
}

const CountdownPill: React.FC<CountdownPillProps> = React.memo(({ events }) => {
  const [countdownTick, setCountdownTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownTick((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getCountdown = useCallback(
    (dateStr: string) => {
      void countdownTick;
      const eventDate = new Date(dateStr);
      eventDate.setHours(0, 0, 0, 0);
      const now = new Date();
      const diff = eventDate.getTime() - now.getTime();

      if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return { days, hours, minutes, seconds, isPast: false };
    },
    [countdownTick]
  );

  const nextEvent = useMemo(() => {
    if (!events || events.length === 0) return null;
    const sortedEvents = [...events].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const now = new Date();
    return (
      sortedEvents.find((e) => new Date(e.date) > now) ||
      sortedEvents[sortedEvents.length - 1]
    );
  }, [events]);

  if (!nextEvent) return null;

  const countdown = getCountdown(nextEvent.date);
  const urgencyPercent = countdown.isPast
    ? 100
    : Math.min(100, Math.max(0, 100 - (countdown.days / 30) * 100));
  const isUrgent = countdown.days <= 3 && !countdown.isPast;
  const eventDate = new Date(nextEvent.date);
  const now = new Date();
  const isToday = eventDate.toDateString() === now.toDateString();
  const isPast = countdown.isPast;

  return (
    <Link
      to="/academic-calendar"
      className={`col-span-2 sm:col-span-1 w-full sm:w-auto group relative flex items-center justify-between sm:justify-start gap-3 pl-3 pr-4 py-2 sm:pr-5 sm:py-2.5 rounded-xl border shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 overflow-hidden ${
        isPast
          ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border-emerald-200 dark:border-emerald-700'
          : isUrgent
            ? 'bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-900/30 dark:to-orange-900/30 border-rose-200 dark:border-rose-700'
            : 'bg-white dark:bg-slate-800/80 backdrop-blur-md border-slate-200 dark:border-slate-700'
      }`}
    >
      {/* Urgency Progress Ring */}
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10">
          <svg
            className="w-full h-full -rotate-90 transform group-hover:scale-110 transition-transform duration-300"
            viewBox="0 0 36 36"
          >
            <path
              className={`${isUrgent ? 'text-rose-100 dark:text-rose-900/30' : 'text-slate-100 dark:text-slate-700'}`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className={`${isUrgent ? 'text-rose-500' : isPast ? 'text-emerald-500' : 'text-purple-500'}`}
              strokeDasharray={`${urgencyPercent}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-base sm:text-lg">
            {getEventEmoji(nextEvent)}
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${
                isUrgent
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {isPast ? (isToday ? 'Happening' : 'Completed') : 'Next Up'}
            </span>
            {isUrgent && !isPast && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            )}
          </div>

          <span
            className={`text-xs sm:text-sm font-bold truncate max-w-[120px] sm:max-w-[140px] ${
              isUrgent
                ? 'text-slate-900 dark:text-white'
                : 'text-slate-700 dark:text-slate-200'
            }`}
          >
            {nextEvent.description}
          </span>
        </div>
      </div>

      {!isPast && (
        <div
          className={`flex items-baseline text-sm font-black ${
            isUrgent
              ? 'text-rose-500 dark:text-rose-400'
              : 'text-purple-600 dark:text-purple-400'
          }`}
        >
          <span>{countdown.days}d</span>
          <span className="text-[10px] ml-0.5 opacity-80 font-bold">
            {countdown.hours}h
          </span>
        </div>
      )}
    </Link>
  );
});

export default CountdownPill;
