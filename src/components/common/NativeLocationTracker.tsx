import React, { useEffect } from 'react';
import { BackgroundGeolocationPlugin } from '@capacitor-community/background-geolocation';
import { registerPlugin } from '@capacitor/core';
import { useAuth } from '@features/auth/hooks/useAuth';
import { detectCurrentZone, updateUserLocation } from '@services/locationAnalyticsService';

const BackgroundGeolocationModule =
  registerPlugin<BackgroundGeolocationPlugin>('BackgroundGeolocation');

/** Streams background location to location analytics while signed in on a native build. */
export const NativeLocationTracker: React.FC = () => {
  const { currentUser } = useAuth();

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
      } catch (err) {
        console.error('Error starting background geolocation:', err);
      }
    };

    initBackgroundLocation();

    return () => {
      if (watcherId) {
        BackgroundGeolocationModule.removeWatcher({ id: watcherId });
      }
    };
  }, [currentUser]);

  return null;
};
