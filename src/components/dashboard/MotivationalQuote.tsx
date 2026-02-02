import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Copy, Check } from 'lucide-react';
import { getRandomItem } from '@lib/utils/helpers';

interface Quote {
  text: string;
  author: string;
}

const MotivationalQuote: React.FC<{ quotes: Quote[] }> = ({ quotes }) => {
  const [currentQuote, setCurrentQuote] = useState(() => getRandomItem(quotes));
  const [isCopied, setIsCopied] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const interval = setInterval(() => handleRefresh(), 30000);
    return () => {
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [quotes]);

  const handleRefresh = useCallback(() => {
    setIsRotating(true);
    // Simple fade out/in effect using CSS classes would require state for "fading out"
    // For simplicity and size, we'll just swap it, or use a key for animation if needed.
    // Let's just swap it immediately for now to save lines,
    // or keep the timeout for the spin animation to complete 1 cycle.
    timerRef.current = setTimeout(() => {
      setCurrentQuote(getRandomItem(quotes));
      setIsRotating(false);
    }, 300);
  }, [quotes]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`"${currentQuote.text}" — ${currentQuote.author}`);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed copy', err);
    }
  }, [currentQuote]);

  return (
    <div className="group relative bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-purple-900/30 border border-slate-200 dark:border-slate-600 rounded-xl p-5 mb-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
      <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
        <button
          onClick={(e) => { e.stopPropagation(); handleCopy(); }}
          className="p-2 bg-white/80 dark:bg-slate-700/80 rounded-full shadow-sm hover:text-blue-600 dark:text-slate-400 transition-all focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Copy quote"
        >
          {isCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleRefresh(); }}
          className="p-2 bg-white/80 dark:bg-slate-700/80 rounded-full shadow-sm hover:text-primary dark:text-slate-400 transition-all focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="New quote"
        >
          <RefreshCw size={14} className={isRotating ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="relative flex items-start gap-3">
        <div className="relative flex-shrink-0 text-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-orange-500 p-2 rounded-lg shadow-md flex items-center justify-center w-12 h-12">
          <span className="drop-shadow-sm">💡</span>
        </div>

        <div className="flex-1 min-w-0 pt-1 animate-fadeIn">
          <p className="text-slate-700 dark:text-slate-200 text-base font-medium italic leading-relaxed group-hover:text-slate-900 dark:group-hover:text-white transition-colors duration-300">
            "{currentQuote.text}"
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium transition-colors duration-300 flex items-center gap-2">
            <span>— {currentQuote.author}</span>
            {isCopied && (
              <span className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full font-bold animate-fadeIn">
                Copied!
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default React.memo(MotivationalQuote);
