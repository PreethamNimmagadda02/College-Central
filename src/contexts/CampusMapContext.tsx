import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
  useCallback,
} from 'react';

import 'firebase/firestore';
import { useAuth } from '@features/auth/hooks/useAuth';
import { db } from '@lib/firebase';
import { logActivity } from '@services/activityService';
import { updateDemoProfile } from '@features/demo/demoStore';

import { useAppConfig } from './AppConfigContext';
import { useUser } from './UserContext';
import { getRealTimeCrowdLevels, LiveZoneStatus } from '@services/locationAnalyticsService';

import { CampusLocation, QuickRoute } from '@/types';

interface CampusMapContextType {
  locations: CampusLocation[];
  quickRoutes: QuickRoute[];
  loading: boolean;
  error: string | null;
  savedPlaces: string[];
  toggleSavePlace: (locationId: string) => Promise<void>;
  getDirections: (from: string, to: string) => string;
  shareLocation: (locationId: string) => Promise<void>;
  liveZoneStatus: LiveZoneStatus[];
}

const CampusMapContext = createContext<CampusMapContextType | undefined>(undefined);

// Authentic IIT (ISM) Dhanbad campus locations data
// Campus Center: 23.8080°N, 86.4385°E (verified from official sources)
// Locations moved to config/campusMap.ts

// QuickRoutes moved to config/campusMap.ts

export const CampusMapProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser, isGuest } = useAuth();
  const { config, loading: configLoading } = useAppConfig();

  // Use locations from config, fall back to empty array if not loaded yet
  const locations = useMemo(() => config.campusMap || [], [config.campusMap]);
  const quickRoutes = useMemo(() => config.quickRoutes || [], [config.quickRoutes]);

  // Saved places live on users/{uid}, which UserProvider already streams (or serves from the demo store)
  const { user, loading: userLoading, error: userError } = useUser();
  const savedPlaces = useMemo(() => user?.savedCampusPlaces ?? [], [user?.savedCampusPlaces]);
  const loading = currentUser ? userLoading : configLoading;
  const error = userError ? 'Failed to load saved places.' : null;
  const [liveZoneStatus, setLiveZoneStatus] = useState<LiveZoneStatus[]>([]);

  // Fetch live zone status every 5 minutes (only when authenticated)
  useEffect(() => {
    // Skip if user is not authenticated - Firestore rules require auth
    if (!currentUser) {
      setLiveZoneStatus([]);
      return;
    }

    const fetchLiveStatus = async () => {
      try {
        const status = await getRealTimeCrowdLevels();
        setLiveZoneStatus(status);
      } catch (err) {
        console.error('Error fetching live zone status:', err);
      }
    };

    fetchLiveStatus();
    const interval = setInterval(fetchLiveStatus, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [currentUser]);

  // Toggle saved place (sync with Firebase)
  const toggleSavePlace = useCallback(
    async (locationId: string) => {
      if (!currentUser) {
        console.error('User must be logged in to save places');
        return;
      }

      const isSaving = !savedPlaces.includes(locationId);
      const newSaved = isSaving
        ? [...savedPlaces, locationId]
        : savedPlaces.filter((id: string) => id !== locationId);

      try {
        if (isGuest) {
          updateDemoProfile({ savedCampusPlaces: newSaved });
        } else {
          const userDocRef = db.collection('users').doc(currentUser.uid);
          await userDocRef.update({
            savedCampusPlaces: newSaved,
          });
        }

        const location = locations.find((loc) => loc.id === locationId);
        if (location) {
          await logActivity(currentUser.uid, {
            type: 'map',
            title: isSaving ? 'Place Saved' : 'Place Unsaved',
            description: isSaving
              ? `Saved "${location.name}" to your places.`
              : `Removed "${location.name}" from your places.`,
            icon: isSaving ? '⭐' : '🗑️',
            link: '/campus-map',
          });
        }
      } catch (err) {
        // A rejected write rolls back Firestore's local cache, so the snapshot reverts the UI
        console.error('Error saving place:', err);
      }
    },
    [currentUser, isGuest, savedPlaces, locations]
  );

  // Get directions URL for Google Maps
  const getDirections = useCallback(
    (from: string, to: string): string => {
      const fromLoc = locations.find((loc: CampusLocation) => loc.name === from);
      const toLoc = locations.find((loc: CampusLocation) => loc.name === to);

      // If existing location, use coordinates. If not, treat as raw query/coordinates.
      const origin = fromLoc ? `${fromLoc.coordinates.lat},${fromLoc.coordinates.lng}` : from;
      const destination = toLoc ? `${toLoc.coordinates.lat},${toLoc.coordinates.lng}` : to;

      if (origin && destination) {
        return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=walking`;
      }

      return `https://www.google.com/maps/search/?api=1&query=IIT+ISM+Dhanbad`;
    },
    [locations]
  );

  // Share location
  const shareLocation = useCallback(
    async (locationId: string) => {
      const location = locations.find((loc: CampusLocation) => loc.id === locationId);
      if (!location) return;

      const shareData = {
        title: location.name,
        text: `${location.name} - ${location.description}\n\nIIT (ISM) Dhanbad Campus`,
        url: `https://www.google.com/maps/search/?api=1&query=${location.coordinates.lat},${location.coordinates.lng}`,
      };

      try {
        if (navigator.share) {
          await navigator.share(shareData);
        } else {
          // Fallback: copy to clipboard
          await navigator.clipboard.writeText(
            `${shareData.title}\n${shareData.text}\n${shareData.url}`
          );
          alert('Location details copied to clipboard!');
        }
      } catch (err) {
        console.error('Error sharing:', err);
      }
    },
    [locations]
  );

  const contextValue = useMemo(
    () => ({
      locations,
      quickRoutes,
      loading,
      error,
      savedPlaces,
      toggleSavePlace,
      getDirections,
      shareLocation,
      liveZoneStatus,
    }),
    [
      locations,
      quickRoutes,
      loading,
      error,
      savedPlaces,
      toggleSavePlace,
      getDirections,
      shareLocation,
      liveZoneStatus,
    ]
  );

  return <CampusMapContext.Provider value={contextValue}>{children}</CampusMapContext.Provider>;
};

export const useCampusMap = () => {
  const context = useContext(CampusMapContext);
  if (context === undefined) {
    throw new Error('useCampusMap must be used within a CampusMapProvider');
  }
  return context;
};
