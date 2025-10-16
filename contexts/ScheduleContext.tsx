import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ClassSchedule } from '../types';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebaseConfig';
import 'firebase/firestore';

interface ScheduleContextType {
  scheduleData: ClassSchedule[] | null;
  setScheduleData: (data: ClassSchedule[] | null) => Promise<void>;
  loading: boolean;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const ScheduleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [scheduleData, setScheduleDataState] = useState<ClassSchedule[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};
    if (currentUser) {
      setLoading(true);
      const userDocRef = db.collection('users').doc(currentUser.uid);
      unsubscribe = userDocRef.onSnapshot((docSnap) => {
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
        setLoading(false);
      });
    } else {
      setScheduleDataState(null);
      setLoading(false);
    }
    return () => unsubscribe();
  }, [currentUser]);

  const setScheduleData = async (data: ClassSchedule[] | null) => {
    if (currentUser) {
      const userDocRef = db.collection('users').doc(currentUser.uid);
      await userDocRef.update({ scheduleData: data });
    }
  };

  return (
    <ScheduleContext.Provider value={{ scheduleData, setScheduleData, loading }}>
      {children}
    </ScheduleContext.Provider>
  );
};

export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
};
