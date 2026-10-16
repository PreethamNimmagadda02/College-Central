import { useAuth } from '@features/auth/hooks/useAuth';
import { updateDemoProfile } from '@features/demo/demoStore';
import { db } from '@lib/firebase';
import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';

import { useUser } from './UserContext';

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
  // The timetable lives on users/{uid}, which UserProvider already streams (or serves from the demo store)
  const { user, loading, error: userError } = useUser();
  const scheduleData = user?.scheduleData ?? null;
  const [writeError, setWriteError] = useState<Error | null>(null);
  const error = writeError ?? userError;

  const setScheduleData = useCallback(
    async (data: ClassSchedule[] | null) => {
      if (isGuest) {
        updateDemoProfile({ scheduleData: data ?? undefined });
        setWriteError(null);
        return;
      }
      if (currentUser) {
        try {
          const userDocRef = db.collection('users').doc(currentUser.uid);
          await userDocRef.update({ scheduleData: data });
          setWriteError(null);
        } catch (err) {
          console.error('Error updating schedule data:', err);
          const error = err instanceof Error ? err : new Error('Failed to update schedule data');
          setWriteError(error);
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
