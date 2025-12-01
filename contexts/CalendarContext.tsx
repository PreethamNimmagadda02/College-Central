import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { AcademicCalendarData, CalendarEvent } from '../types';
import { PRELOADED_CALENDAR_DATA } from '../config/academicCalendar';
import { useAuth } from '../hooks/useAuth';
import { useUser } from './UserContext';
import { useSchedule } from './ScheduleContext';
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
    const newStartDateString = adjustedStartDate.toISOString().slice(0, 10);

    // Adjust end date if it exists
    let newEndDateString: string | undefined = undefined;
    if (event.endDate) {
      const originalEndDate = new Date(`${event.endDate}T12:00:00Z`);
      const originalEndYear = originalEndDate.getUTCFullYear();
      const endYearOffset = originalEndYear - originalStartYear;
      const adjustedEndDate = new Date(originalEndDate);
      adjustedEndDate.setUTCFullYear(currentYear + endYearOffset);
      newEndDateString = adjustedEndDate.toISOString().slice(0, 10);
    }
    
    const adjustedEvent: CalendarEvent = {
      ...event,
      date: newStartDateString,
    };

    // Only include endDate if it exists to avoid assigning undefined
    if (newEndDateString) {
      adjustedEvent.endDate = newEndDateString;
    }

    return adjustedEvent;
  });

  const adjustedStartDate = new Date(`${data.semesterStartDate}T12:00:00Z`);
  adjustedStartDate.setUTCFullYear(currentYear);
  
  const adjustedEndDate = new Date(`${data.semesterEndDate}T12:00:00Z`);
  const originalEndYear = adjustedEndDate.getUTCFullYear();
  const endYearOffset = originalEndYear - originalStartYear;
  adjustedEndDate.setUTCFullYear(currentYear + endYearOffset);

  return {
    ...data,
    semesterStartDate: adjustedStartDate.toISOString().slice(0, 10),
    semesterEndDate: adjustedEndDate.toISOString().slice(0, 10),
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
  const getEventKey = useCallback((event: CalendarEvent): string => {
    return `${event.date}-${event.description}`;
  }, []);
 
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
  const toggleReminderPreference = useCallback(async (eventKey: string) => {
    if (!currentUser) throw new Error('User must be logged in');

    // Store previous state before updating
    const previousPreferences = [...reminderPreferences];
    const newPreferences = reminderPreferences.includes(eventKey)
      ? reminderPreferences.filter(key => key !== eventKey)
      : [...reminderPreferences, eventKey];

    const isAdding = newPreferences.length > reminderPreferences.length;
    const eventDescription = eventKey.split('-').slice(1).join('-');

    // Optimistically update UI
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
      // Revert to previous state on error
      setReminderPreferences(previousPreferences);
    }
  }, [currentUser, reminderPreferences]);

  // Merge preloaded data with user events and adjust dates
  useEffect(() => {
    setLoading(true);

    // Adjust preloaded data to the current year
    const adjustedPreloadedData = adjustCalendarDatesToCurrentYear(PRELOADED_CALENDAR_DATA);

    // Combine adjusted preloaded events with user events
    const mergedEvents = [
      ...adjustedPreloadedData.events,
      ...userEvents
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Determine the current semester based on today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Define semester boundaries based on events
    // We look for "Start of Semester" and "End-Semester Exams"
    const semesterStarts = mergedEvents.filter(e => e.type === 'Start of Semester').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const semesterEnds = mergedEvents.filter(e => e.type === 'End-Semester Exams').sort((a, b) => new Date(a.endDate || a.date).getTime() - new Date(b.endDate || b.date).getTime());

    let currentSemesterStart = adjustedPreloadedData.semesterStartDate;
    let currentSemesterEnd = adjustedPreloadedData.semesterEndDate;

    // Logic to find the active or next semester
    // 1. Try to find a semester we are currently in
    let foundActiveSemester = false;
    
    for (let i = 0; i < semesterStarts.length; i++) {
        const startEvent = semesterStarts[i];
        if (!startEvent) continue;

        // Find the corresponding end event (the next one after this start)
        const endEvent = semesterEnds.find(e => new Date(e.endDate || e.date) > new Date(startEvent.date));
        
        if (endEvent) {
            const startDate = new Date(startEvent.date);
            const endDate = new Date(endEvent.endDate || endEvent.date);
            
            // If today is within this range, or if today is before this range (and it's the first one we find), pick it?
            // Actually, we want the *current* active one.
            if (today >= startDate && today <= endDate) {
                currentSemesterStart = startEvent.date;
                currentSemesterEnd = endEvent.endDate || endEvent.date;
                foundActiveSemester = true;
                break;
            }
        }
    }

    // 2. If not in an active semester, find the NEXT semester
    if (!foundActiveSemester) {
        for (let i = 0; i < semesterStarts.length; i++) {
            const startEvent = semesterStarts[i];
            if (!startEvent) continue;

            const startDate = new Date(startEvent.date);
            
            if (today < startDate) {
                // This is the next upcoming semester
                // Check if we are within 7 days of the start date
                const diffTime = startDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays <= 7) {
                    const endEvent = semesterEnds.find(e => new Date(e.endDate || e.date) > new Date(startEvent.date));
                    if (endEvent) {
                        currentSemesterStart = startEvent.date;
                        currentSemesterEnd = endEvent.endDate || endEvent.date;
                        foundActiveSemester = true;
                        break;
                    }
                }
            }
        }
    }
    


    setCalendarData({
      ...adjustedPreloadedData,
      semesterStartDate: currentSemesterStart,
      semesterEndDate: currentSemesterEnd,
      events: mergedEvents
    });

    setLoading(false);
  }, [userEvents]);

  const { user, updateUser } = useUser();
  const { setScheduleData: setSchedule } = useSchedule();

  // Reset schedule if new semester detected
  useEffect(() => {
    if (!user || !calendarData) return;

    const currentSemesterStart = calendarData.semesterStartDate;
    
    // Check if we have already reset for this semester
    if (user.lastSemesterReset === currentSemesterStart) return;

    // Check if we are in the new semester (or within 7 days of start)
    // The calendarData.semesterStartDate is already updated by the logic above
    // So we just need to confirm we are in that "new" state compared to the user's last reset
    
    const performReset = async () => {
        try {
            // Clear schedule
            await setSchedule([]);
            
            // Update user's last reset date
            await updateUser({ lastSemesterReset: currentSemesterStart });
            
            await logActivity(user.id, {
                type: 'schedule',
                title: 'New Semester Reset',
                description: 'Your weekly schedule has been reset for the new semester.',
                icon: '🔄',
                link: '/schedule'
            });
            
            console.log('Schedule reset for new semester:', currentSemesterStart);
        } catch (error) {
            console.error('Error resetting schedule:', error);
        }
    };

    performReset();
  }, [user, calendarData, setSchedule, updateUser]);

  // Add user event to Firebase
  const addUserEvent = useCallback(async (event: CalendarEvent) => {
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
  }, [currentUser]);

  // Update user event in Firebase
  const updateUserEvent = useCallback(async (eventId: string, event: CalendarEvent) => {
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
  }, [currentUser, reminderPreferences, getEventKey, toggleReminderPreference]); 

  // Delete user event from Firebase
  const deleteUserEvent = useCallback(async (eventId: string) => {
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
  }, [currentUser, reminderPreferences, getEventKey]);

  // Cleanup reminders for past events automatically
  const cleanupPastEventReminders = useCallback(async () => {
    if (!currentUser || !calendarData) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Filter out reminder preferences for events that have passed
    const updatedPreferences = reminderPreferences.filter(eventKey => {
      // Find the event in calendarData that matches this key
      const event = calendarData.events.find(e => getEventKey(e) === eventKey);
      
      if (!event) return false; // Remove if event doesn't exist
      
      // Get the end date of the event
      const eventEndDate = new Date(event.endDate || event.date);
      eventEndDate.setHours(0, 0, 0, 0);
      
      // Keep the reminder if the event hasn't ended yet
      return eventEndDate >= today;
    });
    
    // If there are reminders to remove, update the backend
    if (updatedPreferences.length < reminderPreferences.length) {
      setReminderPreferences(updatedPreferences);
      
      try {
        const prefDocRef = db.collection('userReminderPreferences').doc(currentUser.uid);
        await prefDocRef.set({
          userId: currentUser.uid,
          reminderEventKeys: updatedPreferences
        });
      } catch (error) {
        console.error('Error cleaning up past event reminders:', error);
      }
    }
  }, [currentUser, calendarData, reminderPreferences, getEventKey]);

  // Run reminder cleanup when calendar data or reminders change
  useEffect(() => {
    if (!currentUser || !calendarData) return;
    
    // Run cleanup immediately on mount
    cleanupPastEventReminders();
    
    // Run cleanup once per day (24 hours)
    const intervalId = setInterval(cleanupPastEventReminders, 24 * 60 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [currentUser, calendarData, cleanupPastEventReminders]);

  const contextValue = useMemo(
    () => ({
      calendarData,
      setCalendarData,
      loading,
      addUserEvent,
      updateUserEvent,
      deleteUserEvent,
      reminderPreferences,
      toggleReminderPreference,
      getEventKey
    }),
    [calendarData, setCalendarData, loading, addUserEvent, updateUserEvent, deleteUserEvent, reminderPreferences, toggleReminderPreference, getEventKey]
  );

  return (
    <CalendarContext.Provider value={contextValue}>
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