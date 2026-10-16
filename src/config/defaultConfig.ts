import { PRELOADED_CALENDAR_DATA } from '@config/academicCalendar';
import { GREETING_TIMES, WEATHER } from '@config/appConstants';
import { BRANCH_OPTIONS } from '@config/branches';
import { CAMPUS_LOCATIONS, CAMPUS_QUICK_ROUTES } from '@config/campusMap';
import { COLLEGE_INFO } from '@config/collegeInfo';
import { TIMETABLE_DATA as CBCS_COURSES } from '@config/courseData';
import { CAMPUS_DIRECTORY } from '@config/directory';
import { generalForms, ugForms, pgForms, phdForms } from '@config/forms';
import { DEFAULT_GRADING_SCALE } from '@config/gradingScale';
import { HOSTEL_OPTIONS } from '@config/hostels';
import { NEP_TIMETABLE_DATA as NEP_COURSES } from '@config/nepCourseData';
import { defaultQuickLinks } from '@config/quickLinks';
import { MOTIVATIONAL_QUOTES } from '@config/quotes';
import { STUDENT_DIRECTORY } from '@config/studentDirectory';
import { AdminConfig } from '@features/admin/types';

/** The bundled config: the app's fallback, and what a new college's Firestore is seeded with. */
export const generateDefaultConfig = (): AdminConfig => {
  return {
    collegeInfo: {
      name: { ...COLLEGE_INFO.name },
      email: { ...COLLEGE_INFO.email },
      website: { ...COLLEGE_INFO.website },
      location: { ...COLLEGE_INFO.location },
      heroImageUrl: undefined, // Uses default image when undefined
    },
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
    quickLinks: defaultQuickLinks.map((link) => ({
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
    directory: CAMPUS_DIRECTORY.map((entry) => ({ ...entry })),
    courses: [
      ...CBCS_COURSES.map((c, i) => ({
        id: `cbcs-${i}`,
        courseCode: c.courseCode,
        courseName: c.courseName,
        ltp: c.ltp,
        credits: c.credits,
        slots: c.slots.map((s) => ({ ...s })),
        courseType: 'CBCS' as const,
      })),
      ...NEP_COURSES.map((c, i) => ({
        id: `nep-${i}`,
        courseCode: c.courseCode,
        courseName: c.courseName,
        ltp: c.ltp,
        credits: c.credits,
        slots: c.slots.map((s) => ({ ...s })),
        courseType: 'NEP' as const,
      })),
    ],
    students: STUDENT_DIRECTORY.map((s) => ({ ...s })),
    campusMap: CAMPUS_LOCATIONS.map((l) => ({ ...l })),
    quickRoutes: CAMPUS_QUICK_ROUTES.map((r) => ({ ...r })),
    gradingScale: DEFAULT_GRADING_SCALE.map((g) => ({ ...g })),
  };
};
