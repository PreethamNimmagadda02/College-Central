import { X, Download, Smartphone, Share } from 'lucide-react';
import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// iOS and Safari have no beforeinstallprompt, so they get manual "Add to Home Screen" steps
const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const isManualInstall = isIOSDevice || isSafariBrowser;

const SAFARI_STEPS: { title: string; detail: React.ReactNode }[] = [
  {
    title: 'Tap the Share button',
    detail: (
      <div className="flex items-center gap-1 mt-1 text-slate-500 dark:text-slate-400">
        <Share size={16} />
        <span className="text-xs">in Safari's toolbar</span>
      </div>
    ),
  },
  {
    title: 'Select "Add to Home Screen"',
    detail: (
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        Scroll down if you don't see it
      </p>
    ),
  },
  {
    title: 'Tap "Add"',
    detail: (
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        The app icon will appear on your home screen
      </p>
    ),
  },
];

const BENEFITS = [
  'Works offline',
  'Faster loading',
  isManualInstall ? 'Home screen access' : 'Home screen shortcut',
];

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if user previously dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const now = new Date();
      const daysSinceDismissal = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);

      // Show again after 7 days
      if (daysSinceDismissal < 7) {
        return;
      }
    }

    // For Safari/iOS, show manual installation prompt
    if (isManualInstall) {
      setTimeout(() => setShowPrompt(true), 3000);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show the install prompt after a short delay
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detect if app was installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const choiceResult = await deferredPrompt.userChoice;

    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
      localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-fadeIn">
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary p-4 text-white relative">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Dismiss"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Smartphone size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg">Install College Central</h3>
              <p className="text-sm text-white/90">
                {isManualInstall ? 'For iOS/Safari' : 'Get the app experience'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-slate-700 dark:text-slate-300 text-sm mb-4">
            {isManualInstall
              ? 'Install College Central on your device for quick access and an app-like experience.'
              : 'Install College Central for quick access, offline support, and a native app experience on your device.'}
          </p>

          {/* Installation Steps (Safari/iOS) */}
          {isManualInstall && (
            <div className="space-y-3 mb-4">
              {SAFARI_STEPS.map((step, i) => (
                <div
                  key={step.title}
                  className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300"
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                    {i + 1}
                  </div>
                  <div>
                    <span className="font-medium">{step.title}</span>
                    {step.detail}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Benefits */}
          <div
            className={`space-y-2 mb-4 ${isManualInstall ? 'pt-3 border-t border-slate-200 dark:border-slate-700' : ''}`}
          >
            {isManualInstall && (
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                Benefits
              </p>
            )}
            {BENEFITS.map((benefit) => (
              <div
                key={benefit}
                className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          {/* Buttons */}
          {isManualInstall ? (
            <button
              onClick={handleDismiss}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
            >
              Got it
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleDismiss}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
              >
                Not now
              </button>
              <button
                onClick={handleInstallClick}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm font-medium shadow-lg"
              >
                <Download size={16} />
                Install
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
