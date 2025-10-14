import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AcademicCalendarData } from '../types';
import { PRELOADED_CALENDAR_DATA } from '../data/academicCalendarData';

interface CalendarContextType {
  calendarData: AcademicCalendarData | null;
  setCalendarData: React.Dispatch<React.SetStateAction<AcademicCalendarData | null>>;
  loading: boolean;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const CalendarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [calendarData, setCalendarData] = useState<AcademicCalendarData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Set the preloaded data.
    setCalendarData(PRELOADED_CALENDAR_DATA);
    setLoading(false);
  }, []);

  return (
    <CalendarContext.Provider value={{ calendarData, setCalendarData, loading }}>
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
