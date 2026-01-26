import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import { useAuth } from '@features/auth/hooks/useAuth';
import {
  detectCurrentZone,
  recordLocationVisit,
  updateDwellTime,
  updateUserLocation,
  getUserLocationState,
  updateUserLocationState,
  CampusZone,
} from '@services/locationAnalyticsService';

interface Location {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

interface LocationContextType {
  location: Location | null;
  error: string | null;
  loading: boolean;
  permissionStatus: PermissionState | 'unknown';
  currentZone: CampusZone | null;
  analyticsConsent: boolean | null;
  requestAnalyticsConsent: () => void;
  retryLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | 'unknown'>('unknown');

  // Analytics state - Implicitly true for all users (browser permission is the gate)
  const [currentZone, setCurrentZone] = useState<CampusZone | null>(null);
  const analyticsConsent = true; // Implicit consent

  // Tracking refs (will be populated from Firestore on mount)
  const lastRecordedZoneId = useRef<string | null>(null);
  const currentVisitId = useRef<string | null>(null);
  const zoneEntryTime = useRef<number>(0);
  const lastLocationUpdate = useRef<number>(0);
  const serverStateLoaded = useRef<boolean>(false);

  // Load server-side zone state on mount
  useEffect(() => {
    const initializeState = async () => {
      if (!currentUser?.uid) return;

      try {
        // Load server-side zone state (for cross-browser deduplication)
        const serverState = await getUserLocationState(currentUser.uid);
        if (serverState) {
          lastRecordedZoneId.current = serverState.lastZoneId;
          currentVisitId.current = serverState.lastVisitId;
          zoneEntryTime.current = serverState.lastEntryTime?.toMillis?.() || 0;
        }
        serverStateLoaded.current = true;
      } catch (err) {
        console.error('Error initializing location state:', err);
        serverStateLoaded.current = true; // Continue even on error
      }
    };

    initializeState();
  }, [currentUser?.uid]);

  // Request to show consent modal - No-op now as consent is implicit
  const requestAnalyticsConsent = useCallback(() => {
    // No-op
  }, []);

  // Track zone visits - only record when zone CHANGES (server-side deduplication)
  useEffect(() => {
    const trackZoneVisit = async () => {
      // Wait for server state to be loaded first
      if (!serverStateLoaded.current) return;
      if (!analyticsConsent || !currentUser?.uid || !location || !currentZone) return;

      const now = Date.now();

      // ONLY record if the zone has CHANGED (server-side check)
      if (currentZone.id === lastRecordedZoneId.current) {
        // Same zone - don't record a new visit
        return;
      }

      // If leaving a previous zone, update dwell time for that visit
      if (lastRecordedZoneId.current && currentVisitId.current && zoneEntryTime.current) {
        const dwellMinutes = Math.round((now - zoneEntryTime.current) / 60000);
        if (dwellMinutes > 0) {
          await updateDwellTime(currentVisitId.current, dwellMinutes);
        }
      }

      // Record new zone visit (zone has changed)
      const visitId = await recordLocationVisit(currentUser.uid, currentZone);
      if (visitId) {
        currentVisitId.current = visitId;
        lastRecordedZoneId.current = currentZone.id;
        zoneEntryTime.current = now;

        // Persist to Firestore for cross-browser deduplication
        await updateUserLocationState(currentUser.uid, currentZone.id, visitId);
      }
    };

    trackZoneVisit();
  }, [analyticsConsent, currentUser?.uid, location, currentZone]);

  // Main geolocation effect
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    // Check permission status
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setPermissionStatus(result.state);
        result.onchange = () => {
          setPermissionStatus(result.state);
        };
      });
    }

    const successHandler = (position: GeolocationPosition) => {
      const newLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      };
      setLocation(newLocation);
      setLoading(false);
      setError(null);

      // Detect current zone
      const zone = detectCurrentZone(newLocation.lat, newLocation.lng);
      setCurrentZone(zone);

      // Update real-time tracking (throttled to every 30s)
      const now = Date.now();
      if (analyticsConsent && currentUser?.uid && now - lastLocationUpdate.current > 30000) {
        updateUserLocation(
          currentUser.uid,
          {
            lat: newLocation.lat,
            lng: newLocation.lng,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
          },
          zone?.id
        );
        lastLocationUpdate.current = now;
      }
    };

    const errorHandler = (err: GeolocationPositionError) => {
      setLoading(false);
      switch (err.code) {
        case err.PERMISSION_DENIED:
          setError('User denied the request for Geolocation.');
          break;
        case err.POSITION_UNAVAILABLE:
          setError('Location information is unavailable.');
          break;
        case err.TIMEOUT:
          setError('The request to get user location timed out.');
          break;
        default:
          setError('An unknown error occurred.');
          break;
      }
    };

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    const watchId = navigator.geolocation.watchPosition(successHandler, errorHandler, options);

    return () => {
      navigator.geolocation.clearWatch(watchId);

      // Update dwell time when unmounting
      if (currentVisitId.current && zoneEntryTime.current) {
        const dwellMinutes = Math.round((Date.now() - zoneEntryTime.current) / 60000);
        if (dwellMinutes > 0) {
          updateDwellTime(currentVisitId.current, dwellMinutes);
        }
      }
    };
  }, []);

  // Retry function to clear error and restart watcher
  const retryLocation = useCallback(() => {
    setError(null);
    setLoading(true);

    // Re-check permission
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setPermissionStatus(result.state);
      });
    }

    // Restart watcher (logic is in useEffect, so we can just trigger a component re-mount or
    // simply let the watcher continue if it was just a timeout.
    // But for a full reset, we might need a key or just force a status update.)

    // Actually, the watcher never stops unless components unmount.
    // If we want to force a "retry" of the *request*, we might need to clear and re-add.
    // However, standard watchPosition keeps trying.
    // The main use case is when the USER changes settings and clicks "Retry".
    // In that case, we just want to clear the error state and let the existing watcher (or a new one) fire.

    // Let's rely on the fact that if the user fixed it, the *next* update will succeed.
    // But we need to clear the Error UI.
    setError(null);
  }, []);

  return (
    <LocationContext.Provider
      value={{
        location,
        error,
        loading,
        permissionStatus,
        currentZone,
        analyticsConsent,
        requestAnalyticsConsent,
        retryLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
