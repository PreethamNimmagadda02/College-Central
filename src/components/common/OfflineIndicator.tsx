import { WifiOff, Wifi } from 'lucide-react';
import React, { useState, useEffect } from 'react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOnlineMessage, setShowOnlineMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineMessage(true);
      // Hide the "back online" message after 3 seconds
      setTimeout(() => setShowOnlineMessage(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOnlineMessage(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Show "back online" message temporarily
  if (showOnlineMessage) {
    return (
      <div
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] animate-fadeIn"
        role="status"
        aria-live="polite"
      >
        <div className="bg-green-600/95 backdrop-blur-md border border-green-400/30 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-3">
          <Wifi size={20} className="animate-pulse" />
          <span className="font-bold tracking-wide">Back online!</span>
        </div>
      </div>
    );
  }

  // Show "offline" indicator when offline
  if (!isOnline) {
    return (
      <div
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] animate-fadeIn"
        role="alert"
        aria-live="assertive"
      >
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-4">
          <div className="p-2 bg-red-500/20 rounded-full">
            <WifiOff size={20} className="text-red-400" />
          </div>
          <div>
            <div className="font-bold text-red-100">You're offline</div>
            <div className="text-xs text-slate-400 font-medium mt-0.5">
              Some features may be limited
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
