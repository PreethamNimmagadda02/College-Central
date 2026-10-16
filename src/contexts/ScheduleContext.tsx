import { useAuth } from '@features/auth/hooks/useAuth';
import { db } from '@lib/firebase';
import { subscribeDemoState, updateDemoProfile } from '@features/demo/demoStore';
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useMemo,
  useCallback,
} from 'react';

import { ClassSchedule } from '@/types';

interface ScheduleContextType {
  scheduleData: ClassSchedule[] | null;
  setScheduleData: (data: ClassSchedule[] | null) => Promise<void>;
  loading: boolean;
  error: Error | null;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const ScheduleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser, isGuest } = useAuth();
  const [scheduleData, setScheduleDataState] = useState<ClassSchedule[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (isGuest) {
      return subscribeDemoState((state) => {
        setScheduleDataState(state.profile.scheduleData ?? null);
        setError(null);
        setLoading(false);
      });
    }

    let unsubscribe: (() => void) | null = null;
    if (currentUser) {
      setLoading(true);
      setError(null);
      const userDocRef = db.collection('users').doc(currentUser.uid);

      // OPTIMIZATION: First load from Firestore cache for instant UI
      userDocRef
        .get({ source: 'cache' })
        .then((docSnap) => {
          if (docSnap.exists) {
            const data = docSnap.data();
            if (data?.scheduleData) {
              setScheduleDataState(data.scheduleData as ClassSchedule[]);
              setLoading(false); // Show cached data immediately
            }
          }
        })
        .catch(() => {
          // Cache miss expected on first load
        });

      // Then subscribe for real-time updates
      unsubscribe = userDocRef.onSnapshot(
        { includeMetadataChanges: false },
        (docSnap) => {
          if (docSnap.exists) {
            const data = docSnap.data();
            if (data && data.scheduleData) {
              setScheduleDataState(data.scheduleData as ClassSchedule[]);
            } else {
              setScheduleDataState(null);
            }
          } else {
            setScheduleDataState(null);
          }
          setError(null);
          setLoading(false);
        },
        (err) => {
          console.error('Error loading schedule data:', err);
          setError(err instanceof Error ? err : new Error('Failed to load schedule data'));
          setScheduleDataState(null);
          setLoading(false);
        }
      );
    } else {
      setScheduleDataState(null);
      setError(null);
      setLoading(false);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser, isGuest]);

  const setScheduleData = useCallback(
    async (data: ClassSchedule[] | null) => {
      if (isGuest) {
        updateDemoProfile({ scheduleData: data ?? undefined });
        setError(null);
        return;
      }
      if (currentUser) {
        try {
          const userDocRef = db.collection('users').doc(currentUser.uid);
          await userDocRef.update({ scheduleData: data });
          setError(null);
        } catch (err) {
          console.error('Error updating schedule data:', err);
          const error = err instanceof Error ? err : new Error('Failed to update schedule data');
          setError(error);
          throw error;
        }
      }
    },
    [currentUser, isGuest]
  );

  const contextValue = useMemo(
    () => ({ scheduleData, setScheduleData, loading, error }),
    [scheduleData, setScheduleData, loading, error]
  );

  return <ScheduleContext.Provider value={contextValue}>{children}</ScheduleContext.Provider>;
};

export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
};
