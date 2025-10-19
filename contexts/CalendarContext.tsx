import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AcademicCalendarData, CalendarEvent } from '../types';
import { PRELOADED_CALENDAR_DATA } from '../data/academicCalendarData';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebaseConfig';
// FIX: Updated Firebase imports for v9 compatibility.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { logActivity } from '../services/activityService';

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

// Helper function to adjust the years of academic calendar events to the current year
const adjustCalendarDatesToCurrentYear = (data: AcademicCalendarData): AcademicCalendarData => {
  const currentYear = new Date().getFullYear();
  const originalStartYear = new Date(data.semesterStartDate).getFullYear();

  const adjustedEvents = data.events.map(event => {
    const originalEventDate = new Date(`${event.date}T12:00:00Z`); // Use midday UTC to avoid timezone shifts
    const originalEventYear = originalEventDate.getUTCFullYear();
    const yearOffset = originalEventYear - originalStartYear;
    const newYear = currentYear + yearOffset;

    // Adjust start date
    const adjustedStartDate = new Date(originalEventDate);
    adjustedStartDate.setUTCFullYear(newYear);
    const newStartDateString = adjustedStartDate.toISOString().split('T')[0];

    // Adjust end date if it exists
    let newEndDateString: string | undefined = undefined;
    if (event.endDate) {
      const originalEndDate = new Date(`${event.endDate}T12:00:00Z`);
      const originalEndYear = originalEndDate.getUTCFullYear();
      const endYearOffset = originalEndYear - originalStartYear;
      const adjustedEndDate = new Date(originalEndDate);
      adjustedEndDate.setUTCFullYear(currentYear + endYearOffset);
      newEndDateString = adjustedEndDate.toISOString().split('T')[0];
    }
    
    return {
      ...event,
      date: newStartDateString,
      endDate: newEndDateString,
    };
  });

  const adjustedStartDate = new Date(`${data.semesterStartDate}T12:00:00Z`);
  adjustedStartDate.setUTCFullYear(currentYear);
  
  const adjustedEndDate = new Date(`${data.semesterEndDate}T12:00:00Z`);
  const originalEndYear = adjustedEndDate.getUTCFullYear();
  const endYearOffset = originalEndYear - originalStartYear;
  adjustedEndDate.setUTCFullYear(currentYear + endYearOffset);

  return {
    ...data,
    semesterStartDate: adjustedStartDate.toISOString().split('T')[0],
    semesterEndDate: adjustedEndDate.toISOString().split('T')[0],
    events: adjustedEvents,
  };
};

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

    const q = db.collection('userEvents').where('userId', '==', currentUser.uid);

    const unsubscribe = q.onSnapshot((snapshot: firebase.firestore.QuerySnapshot) => {
      const events = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id
        } as CalendarEvent;
      });
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
        const prefDocRef = db.collection('userReminderPreferences').doc(currentUser.uid);
        const prefDoc = await prefDocRef.get();

        if (prefDoc.exists) {
          const data = prefDoc.data();
          if (data && data.reminderEventKeys) {
            setReminderPreferences(data.reminderEventKeys || []);
          }
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
    
    const isAdding = newPreferences.length > reminderPreferences.length;
    const eventDescription = eventKey.split('-').slice(1).join('-');

    setReminderPreferences(newPreferences);

    try {
      const prefDocRef = db.collection('userReminderPreferences').doc(currentUser.uid);
      await prefDocRef.set({
        userId: currentUser.uid,
        reminderEventKeys: newPreferences
      });
      await logActivity(currentUser.uid, {
        type: 'reminder',
        title: isAdding ? 'Reminder Set' : 'Reminder Removed',
        description: `For event: "${eventDescription}"`,
        icon: isAdding ? '🔔' : '🔕',
        link: '/academic-calendar'
      });
    } catch (error) {
      console.error('Error updating reminder preferences:', error);
      // Revert on error
      setReminderPreferences(reminderPreferences);
    }
  };

  // Merge preloaded data with user events and adjust dates
  useEffect(() => {
    setLoading(true);

    // Adjust preloaded data to the current year
    const adjustedPreloadedData = adjustCalendarDatesToCurrentYear(PRELOADED_CALENDAR_DATA);

    // Combine adjusted preloaded events with user events (user events are assumed to be for current year)
    const mergedEvents = [
      ...adjustedPreloadedData.events,
      ...userEvents
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setCalendarData({
      ...adjustedPreloadedData,
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
    
    await db.collection('userEvents').add(eventData);

    await logActivity(currentUser.uid, {
        type: 'event',
        title: 'Event Added',
        description: `Added "${event.description}" to calendar.`,
        icon: '📅',
        link: '/academic-calendar'
    });
  };

  // Update user event in Firebase
  const updateUserEvent = async (eventId: string, event: CalendarEvent) => {
    if (!currentUser) throw new Error('User must be logged in');

    const eventRef = db.collection('userEvents').doc(eventId);
    const oldEventSnap = await eventRef.get();
    const oldEvent = oldEventSnap.data() as CalendarEvent;

    await eventRef.update({
      ...event,
      updatedAt: new Date().toISOString()
    });

    // Check if only reminder was toggled
    const reminderToggled = oldEvent.remindMe !== event.remindMe;
    const onlyReminderChanged = reminderToggled &&
      oldEvent.date === event.date &&
      oldEvent.description === event.description &&
      oldEvent.type === event.type;

    // Sync reminder preference with remindMe flag
    if (reminderToggled) {
      const eventKey = getEventKey(event);
      const hasPreference = reminderPreferences.includes(eventKey);

      // If remindMe is true but preference doesn't exist, add it
      if (event.remindMe && !hasPreference) {
        await toggleReminderPreference(eventKey);
      }
      // If remindMe is false but preference exists, remove it
      else if (!event.remindMe && hasPreference) {
        await toggleReminderPreference(eventKey);
      }
    }

    if (onlyReminderChanged) {
      await logActivity(currentUser.uid, {
        type: 'reminder',
        title: event.remindMe ? 'Reminder Set' : 'Reminder Removed',
        description: `For event: "${event.description}"`,
        icon: event.remindMe ? '🔔' : '🔕',
        link: '/academic-calendar'
      });
    } else {
      await logActivity(currentUser.uid, {
        type: 'event',
        title: 'Event Updated',
        description: `Updated event: "${event.description}"`,
        icon: '✏️',
        link: '/academic-calendar'
      });
    }
  }; 

  // Delete user event from Firebase
  const deleteUserEvent = async (eventId: string) => {
    if (!currentUser) throw new Error('User must be logged in');

    const eventRef = db.collection('userEvents').doc(eventId);
    const eventSnap = await eventRef.get();

    if (eventSnap.exists) {
        const eventData = eventSnap.data() as CalendarEvent;

        // Delete the event from Firebase
        await eventRef.delete();

        // Remove reminder preference if it exists
        const eventKey = getEventKey(eventData);
        if (reminderPreferences.includes(eventKey)) {
            const newPreferences = reminderPreferences.filter(key => key !== eventKey);
            setReminderPreferences(newPreferences);

            try {
                const prefDocRef = db.collection('userReminderPreferences').doc(currentUser.uid);
                await prefDocRef.set({
                    userId: currentUser.uid,
                    reminderEventKeys: newPreferences
                });
            } catch (error) {
                console.error('Error removing reminder preference:', error);
            }
        }

        await logActivity(currentUser.uid, {
            type: 'event',
            title: 'Event Deleted',
            description: `Deleted event: "${eventData.description}"${reminderPreferences.includes(eventKey) ? ' and its reminder' : ''}`,
            icon: '🗑️',
            link: '/academic-calendar'
        });
    } else {
        // Fallback if the event doesn't exist for some reason
        await eventRef.delete();
    }
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