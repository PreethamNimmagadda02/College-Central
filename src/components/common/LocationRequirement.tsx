import React from 'react';
import { useLocation } from '@contexts/LocationContext';
import { MapPin, RefreshCw } from 'lucide-react';

export const LocationRequirement: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { permissionStatus, error, loading, location, retryLocation } = useLocation();

  // If we have a location, we're good.
  if (location) {
    return <>{children}</>;
  }

  // If loading and we don't have a definitive error yet, we might want to show a loader or just wait.
  // However, if it takes too long, the user sees nothing if we block.
  // But usually existing loaders handle the initial state.
  // Let's allow "loading" state to pass through if we want to show the app shell?
  // No, strictly block if we want "mandatory" location.
  // But initially 'loading' is true.
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Acquiring location...</p>
        </div>
      </div>
    );
  }

  // If permission is denied or we have an error
  if (permissionStatus === 'denied' || error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center">
        <div className="w-full max-w-md space-y-6">
          <div className="flex justify-center">
            <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full">
              <MapPin className="w-12 h-12 text-red-600 dark:text-red-400" />
            </div>
          </div>

          <h1 className="text-2xl font-bold tracking-tight">Location Access Required</h1>

          <p className="text-muted-foreground">
            {permissionStatus === 'denied'
              ? "It looks like you've denied location access. This app requires your location to provide campus services and analytics."
              : error ||
                "We couldn't determine your location. Please ensure location services are enabled."}
          </p>

          <div className="bg-muted/50 p-4 rounded-lg text-sm text-left space-y-2">
            <p className="font-medium">How to enable location:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Check your browser address bar for a blocked location icon.</li>
              <li>Click it and select "Allow" or "Reset permission".</li>
              <li>Reload the page.</li>
            </ul>
          </div>

          <div className="pt-4">
            <button
              onClick={() => {
                retryLocation();
                window.location.reload(); // Hard reload often helps with permission resets
              }}
              className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry & Reload
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If permission is 'prompt' or 'unknown', we are waiting for the browser prompt or the result.
  // usually 'loading' covers the wait, but if we are here, loading is false.
  // If we are here and no location, it implies we are waiting for user action on the browser prompt
  // OR the geolocation just hasn't fired yet despite no error.

  // safe fallback to show a message if we are stuck.
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-4">
        <div className="animate-pulse w-16 h-16 bg-muted rounded-full mx-auto mb-4"></div>
        <p className="text-muted-foreground">Waiting for location access...</p>
        <p className="text-xs text-muted-foreground/60">
          Please allow location access when prompted.
        </p>
      </div>
    </div>
  );
};
