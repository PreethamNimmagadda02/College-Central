import React, { useState, useEffect, useMemo } from 'react';
import { useAppConfig } from '@contexts/AppConfigContext';
import { getRandomItem } from '@lib/utils/helpers';

const QuoteSection: React.FC = () => {
  const { config: appConfig } = useAppConfig();

  // Get quotes from config
  const configQuotes = useMemo(() => {
    if (appConfig?.quotes && appConfig.quotes.length > 0) {
      return appConfig.quotes.map((q) => ({ text: q.text, author: q.author }));
    }
    return [
      { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
    ];
  }, [appConfig?.quotes]);

  // Start with a random quote, then change every 30 seconds
  const [quote, setQuote] = useState(() => getRandomItem(configQuotes));

  useEffect(() => {
    // Update quote when configQuotes changes to ensure we have valid data
    setQuote(getRandomItem(configQuotes));

    const quoteInterval = setInterval(() => {
      setQuote(getRandomItem(configQuotes));
    }, 30000); // 30 seconds

    return () => clearInterval(quoteInterval);
  }, [configQuotes]);

  return (
    <div className="group relative bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-purple-900/30 border border-slate-200 dark:border-slate-600 rounded-xl p-5 mb-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden">
      {/* Animated background shimmer */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

      <div className="relative flex items-start gap-3">
        <div className="relative">
          {/* Glow effect for icon */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg blur opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
          <div
            className="relative text-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-orange-500 p-2 rounded-lg shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300"
            style={{ backgroundSize: '200% 200%' }}
          >
            <span className="drop-shadow-sm group-hover:drop-shadow-md transition-all duration-300">
              💡
            </span>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-slate-700 dark:text-slate-200 text-base font-medium italic leading-relaxed group-hover:text-slate-900 dark:group-hover:text-white transition-colors duration-300">
            "{quote.text}"
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors duration-300">
            — {quote.author}
          </p>
        </div>
      </div>
    </div>
  );
};

export default React.memo(QuoteSection);
