import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AcademicCalendarData, CalendarEvent } from '../types';
import { PRELOADED_CALENDAR_DATA } from '../data/academicCalendarData';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebaseConfig';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc } from 'firebase/firestore';

interface CalendarContextType {
  calendarData: AcademicCalendarData | null;
  setCalendarData: React.Dispatch<React.SetStateAction<AcademicCalendarData | null>>;
  loading: boolean;
  addUserEvent: (event: CalendarEvent) => Promise<void>;
  updateUserEvent: (eventId: string, event: CalendarEvent) => Promise<void>;
  deleteUserEvent: (eventId: string) => Promise<void>;
  reminderPreferences: string[];
  toggleReminderPreference: (eventKey: string) => Promise<void>;
  getEventKey: (event: CalendarEvent) => string;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const CalendarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [calendarData, setCalendarData] = useState<AcademicCalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEvents, setUserEvents] = useState<CalendarEvent[]>([]);
  const [reminderPreferences, setReminderPreferences] = useState<string[]>([]);

  // Generate unique key for an event
  const getEventKey = (event: CalendarEvent): string => {
    return `${event.date}-${event.description}`;
  };
 
  // Load user's custom events from Firebase
  useEffect(() => {
    if (!currentUser) {
      setUserEvents([]);
      return;
    }

    const q = query(
      collection(db, 'userEvents'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as CalendarEvent));
      console.log('CalendarContext - Loaded user events from Firebase:', events);
      setUserEvents(events);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Load user's reminder preferences
  useEffect(() => {
    if (!currentUser) {
      setReminderPreferences([]);
      return;
    }

    const loadPreferences = async () => {
      try {
        const prefDocRef = doc(db, 'userReminderPreferences', currentUser.uid);
        const prefDoc = await getDoc(prefDocRef);

        if (prefDoc.exists()) {
          const data = prefDoc.data();
          setReminderPreferences(data.reminderEventKeys || []);
          console.log('CalendarContext - Loaded reminder preferences:', data.reminderEventKeys);
        } else {
          setReminderPreferences([]);
        }
      } catch (error) {
        console.error('Error loading reminder preferences:', error);
      }
    };

    loadPreferences();
  }, [currentUser]);

  // Toggle reminder preference for an event
  const toggleReminderPreference = async (eventKey: string) => {
    if (!currentUser) throw new Error('User must be logged in');

    const newPreferences = reminderPreferences.includes(eventKey)
      ? reminderPreferences.filter(key => key !== eventKey)
      : [...reminderPreferences, eventKey];

    setReminderPreferences(newPreferences);

    try {
      const prefDocRef = doc(db, 'userReminderPreferences', currentUser.uid);
      await setDoc(prefDocRef, {
        userId: currentUser.uid,
        reminderEventKeys: newPreferences
      });
      console.log('CalendarContext - Updated reminder preferences:', newPreferences);
    } catch (error) {
      console.error('Error updating reminder preferences:', error);
      // Revert on error
      setReminderPreferences(reminderPreferences);
    }
  };

  // Merge preloaded data with user events
  useEffect(() => {
    setLoading(true);

    // Combine preloaded events with user events
    const mergedEvents = [
      ...PRELOADED_CALENDAR_DATA.events,
      ...userEvents
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    console.log('CalendarContext - Merging events:', {
      preloadedCount: PRELOADED_CALENDAR_DATA.events.length,
      userEventsCount: userEvents.length,
      mergedCount: mergedEvents.length,
      userEvents: userEvents
    });

    setCalendarData({
      ...PRELOADED_CALENDAR_DATA,
      events: mergedEvents
    });

    setLoading(false);
  }, [userEvents]);

  // Add user event to Firebase
  const addUserEvent = async (event: CalendarEvent) => {
    if (!currentUser) throw new Error('User must be logged in');

    const eventData = {
      ...event,
      userId: currentUser.uid,
      createdAt: new Date().toISOString()
    };

    console.log('CalendarContext - Adding event to Firebase:', eventData);
    await addDoc(collection(db, 'userEvents'), eventData);
  };

  // Update user event in Firebase
  const updateUserEvent = async (eventId: string, event: CalendarEvent) => {
    if (!currentUser) throw new Error('User must be logged in');

    const eventRef = doc(db, 'userEvents', eventId);
    await updateDoc(eventRef, {
      ...event,
      updatedAt: new Date().toISOString()
    });
  };

  // Delete user event from Firebase
  const deleteUserEvent = async (eventId: string) => {
    if (!currentUser) throw new Error('User must be logged in');

    const eventRef = doc(db, 'userEvents', eventId);
    await deleteDoc(eventRef);
  };

  return (
    <CalendarContext.Provider value={{
      calendarData,
      setCalendarData,
      loading,
      addUserEvent,
      updateUserEvent,
      deleteUserEvent,
      reminderPreferences,
      toggleReminderPreference,
      getEventKey
    }}>
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};
