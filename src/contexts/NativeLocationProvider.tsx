import React, { createContext, useEffect, useState, ReactNode } from 'react';
import { BackgroundGeolocationPlugin } from '@capacitor-community/background-geolocation';
import { registerPlugin } from '@capacitor/core';
import { useAuth } from '@features/auth/hooks/useAuth';
import { detectCurrentZone, updateUserLocation } from '@services/locationAnalyticsService';

const BackgroundGeolocationModule =
  registerPlugin<BackgroundGeolocationPlugin>('BackgroundGeolocation');

interface NativeLocationContextType {
  isTracking: boolean;
  startTracking: () => Promise<void>;
  stopTracking: () => Promise<void>;
}

const NativeLocationContext = createContext<NativeLocationContextType | undefined>(undefined);

export const NativeLocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  // We can reuse the existing LocationContext logic or bypass it.
  // Ideally, we feed data INTO the existing LocationProvider via a bridge,
  // OR we allow this provider to run independently for background tasks.

  // For now, let's implement the background tracking logic:

  useEffect(() => {
    let watcherId: string | undefined;

    const initBackgroundLocation = async () => {
      if (!currentUser) return;

      try {
        // Remove existing listeners
        await BackgroundGeolocationModule.removeWatcher({
          id: 'background-location-watcher',
        });
      } catch (e) {
        // Ignore if not exists
      }

      try {
        watcherId = await BackgroundGeolocationModule.addWatcher(
          {
            backgroundMessage: 'Cancel to prevent battery drain.',
            backgroundTitle: 'Tracking You.',
            requestPermissions: true,
            stale: false,
            distanceFilter: 10,
          },
          async (location, error) => {
            if (error) {
              if (error.code === 'NOT_AUTHORIZED') {
                if (
                  window.confirm(
                    'This app needs your location, ' +
                      'but does not have permission.\n\n' +
                      'Open settings now?'
                  )
                ) {
                  BackgroundGeolocationModule.openSettings();
                }
              }
              console.error(error);
              return;
            }

            if (location) {
              console.log('Background location:', location);

              // 1. Detect Zone
              const zone = detectCurrentZone(location.latitude, location.longitude);

              // 2. Update Server
              // Note: In a real background scenario, we might want to batch these or verify network
              // But for MVP, direct call is okay if network is alive.
              await updateUserLocation(
                currentUser.uid,
                {
                  lat: location.latitude,
                  lng: location.longitude,
                  heading: location.bearing ?? undefined,
                  speed: location.speed ?? undefined,
                },
                zone?.id
              );
            }
          }
        );

        setIsTracking(true);
      } catch (err) {
        console.error('Error starting background geolocation:', err);
      }
    };

    if (currentUser) {
      initBackgroundLocation();
    }

    return () => {
      if (watcherId) {
        BackgroundGeolocationModule.removeWatcher({ id: watcherId });
      }
    };
  }, [currentUser]);

  const startTracking = async () => {
    // Implementation for manual start if needed
  };

  const stopTracking = async () => {
    // Implementation for manual stop if needed
  };

  return (
    <NativeLocationContext.Provider value={{ isTracking, startTracking, stopTracking }}>
      {children}
    </NativeLocationContext.Provider>
  );
};
