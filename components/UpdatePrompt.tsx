import React, { useEffect, useState } from 'react';

const UpdatePrompt: React.FC = () => {
    const [showPrompt, setShowPrompt] = useState(false);
    const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

    useEffect(() => {
        // Check if service workers are supported
        if (!('serviceWorker' in navigator)) return;

        // Listen for service worker updates
        navigator.serviceWorker.ready.then(registration => {
            // Check if there's a waiting service worker
            if (registration.waiting) {
                setWaitingWorker(registration.waiting);
                setShowPrompt(true);
            }

            // Listen for new service worker installing
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (!newWorker) return;

                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // New service worker is installed and ready
                        setWaitingWorker(newWorker);
                        setShowPrompt(true);
                    }
                });
            });
        });

        // Listen for messages from service worker
        const messageHandler = (event: MessageEvent) => {
            if (event.data && event.data.type === 'SW_UPDATED') {
                setShowPrompt(true);
            }
        };

        navigator.serviceWorker.addEventListener('message', messageHandler);

        // Check for updates periodically (every 5 minutes)
        const checkForUpdates = setInterval(() => {
            navigator.serviceWorker.ready.then(registration => {
                registration.update();
            });
        }, 5 * 60 * 1000);

        return () => {
            navigator.serviceWorker.removeEventListener('message', messageHandler);
            clearInterval(checkForUpdates);
        };
    }, []);

    // Handle controller change (when new SW takes over)
    useEffect(() => {
        if (!('serviceWorker' in navigator)) return;

        const handleControllerChange = () => {
            // New service worker has taken control, reload to use new version
            window.location.reload();
        };

        navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

        return () => {
            navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
        };
    }, []);

    const handleUpdate = () => {
        // Try to use the state worker, or fetch fresh from registration
        const workerToActivate = waitingWorker;

        if (workerToActivate) {
            workerToActivate.postMessage({ type: 'SKIP_WAITING' });
        } else {
            // Fallback: try to find waiting worker from registration
            navigator.serviceWorker.ready.then(registration => {
                if (registration.waiting) {
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                } else {
                    // If no waiting worker, just reload
                    window.location.reload();
                }
            });
        }

        // Fallback: Reload after a short delay if controllerchange doesn't fire
        // This handles cases where the SW activates but the event is missed or delayed
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-md animate-fadeIn">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl border-2 border-primary dark:border-secondary p-4">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 text-2xl">
                        🔄
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                            Update Available
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                            A new version of College Central is available. Reload to get the latest features and fixes.
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={handleUpdate}
                                className="px-4 py-2 bg-primary hover:bg-primary-dark dark:bg-secondary dark:hover:bg-secondary/80 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                Reload Now
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
                            >
                                Later
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                        aria-label="Close"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpdatePrompt;
