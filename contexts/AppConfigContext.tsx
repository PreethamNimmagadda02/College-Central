import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { AdminConfig } from '../admin/types';
import { subscribeToConfig, initializeConfig } from '../services/configService';

// Import default config values for fallback
import { COLLEGE_INFO } from '../config/collegeInfo';
import { GREETING_TIMES, WEATHER } from '../config/appConstants';
import { BRANCH_OPTIONS } from '../config/branches';
import { HOSTEL_OPTIONS } from '../config/hostels';
import { MOTIVATIONAL_QUOTES } from '../config/quotes';
import { defaultQuickLinks } from '../config/quickLinks';
import { generalForms, ugForms, pgForms, phdForms } from '../config/forms';
import { PRELOADED_CALENDAR_DATA } from '../config/academicCalendar';
import { CAMPUS_DIRECTORY } from '../config/directory';
import { CAMPUS_LOCATIONS, CAMPUS_QUICK_ROUTES } from '../config/campusMap';
import { TIMETABLE_DATA as CBCS_COURSES } from '../config/courseData';
import { NEP_TIMETABLE_DATA as NEP_COURSES } from '../config/nepCourseData';
import { STUDENT_DIRECTORY } from '../config/studentDirectory';

interface AppConfigContextType {
  config: AdminConfig;
  loading: boolean;
  error: Error | null;
  isFirestoreConfig: boolean; // true if config is from Firestore, false if fallback
}

const AppConfigContext = createContext<AppConfigContextType | undefined>(undefined);

// Generate default config from static files (fallback)
const generateDefaultConfig = (): AdminConfig => {
  return {
    collegeInfo: {
      name: { ...COLLEGE_INFO.name },
      email: { ...COLLEGE_INFO.email },
      website: { ...COLLEGE_INFO.website },
      location: { ...COLLEGE_INFO.location },
      heroImageUrl: undefined, // Uses default image when undefined
    },
    adminEmails: [], // Empty by default, configure in Firestore
    appConstants: {
      greetingTimes: {
        morningEnd: GREETING_TIMES.MORNING_END,
        afternoonEnd: GREETING_TIMES.AFTERNOON_END,
      },
      weather: {
        lat: WEATHER.DHANBAD_LAT,
        lon: WEATHER.DHANBAD_LON,
      },
    },
    branches: [...BRANCH_OPTIONS],
    hostels: [...HOSTEL_OPTIONS],
    quotes: MOTIVATIONAL_QUOTES.map((q, i) => ({
      id: `quote-${i}`,
      text: q.text,
      author: q.author,
    })),
    quickLinks: defaultQuickLinks.map(link => ({
      id: link.id,
      name: link.name,
      href: link.href,
      color: link.color || 'text-blue-600 dark:text-blue-400',
      icon: link.icon || 'website',
    })),
    forms: [
      ...generalForms.map((f, i) => ({ ...f, id: `general-${i}`, category: 'general' as const })),
      ...ugForms.map((f, i) => ({ ...f, id: `ug-${i}`, category: 'ug' as const })),
      ...pgForms.map((f, i) => ({ ...f, id: `pg-${i}`, category: 'pg' as const })),
      ...phdForms.map((f, i) => ({ ...f, id: `phd-${i}`, category: 'phd' as const })),
    ],
    calendar: {
      semesterStartDate: PRELOADED_CALENDAR_DATA.semesterStartDate,
      semesterEndDate: PRELOADED_CALENDAR_DATA.semesterEndDate,
      events: PRELOADED_CALENDAR_DATA.events.map((e, i) => ({
        id: `event-${i}`,
        ...e,
      })),
    },
    directory: CAMPUS_DIRECTORY.map(entry => ({ ...entry })),
    courses: [
      ...CBCS_COURSES.map((c, i) => ({
        id: `cbcs-${i}`,
        courseCode: c.courseCode,
        courseName: c.courseName,
        ltp: c.ltp,
        credits: c.credits,
        slots: c.slots.map(s => ({ ...s })),
        courseType: 'CBCS' as const,
      })),
      ...NEP_COURSES.map((c, i) => ({
        id: `nep-${i}`,
        courseCode: c.courseCode,
        courseName: c.courseName,
        ltp: c.ltp,
        credits: c.credits,
        slots: c.slots.map(s => ({ ...s })),
        courseType: 'NEP' as const,
      })),
    ],
    students: STUDENT_DIRECTORY.map((s) => ({ ...s })),
    campusMap: CAMPUS_LOCATIONS.map((l) => ({ ...l })),
    quickRoutes: CAMPUS_QUICK_ROUTES.map((r) => ({ ...r })),
  };
};

export const AppConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AdminConfig>(generateDefaultConfig);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFirestoreConfig, setIsFirestoreConfig] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Initialize config if it doesn't exist
    const defaultConfig = generateDefaultConfig();
    initializeConfig(defaultConfig).catch(console.error);

    // Subscribe to real-time updates - this is independent of auth
    // Config is read-only and should always be available
    const unsubscribe = subscribeToConfig((firestoreConfig) => {
      if (firestoreConfig) {
        setConfig(firestoreConfig);
        setIsFirestoreConfig(true);
      } else {
        // Fallback to default config
        setConfig(defaultConfig);
        setIsFirestoreConfig(false);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []); // No dependencies - subscribe once on mount

  const contextValue = useMemo(
    () => ({
      config,
      loading,
      error,
      isFirestoreConfig,
    }),
    [config, loading, error, isFirestoreConfig]
  );

  return (
    <AppConfigContext.Provider value={contextValue}>
      {children}
    </AppConfigContext.Provider>
  );
};

export const useAppConfig = (): AppConfigContextType => {
  const context = useContext(AppConfigContext);
  if (context === undefined) {
    throw new Error('useAppConfig must be used within an AppConfigProvider');
  }
  return context;
};

// Export default config generator for use elsewhere
export { generateDefaultConfig };
