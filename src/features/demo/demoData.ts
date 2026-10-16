// Sample data for guest demo mode. Every person in it is fictional, and every
// date is relative to the moment the demo is seeded, so it never looks stale.

import { generalForms, ugForms } from '@config/forms';
import { NEP_TIMETABLE_DATA } from '@config/nepCourseData';
import { getCourseOptionFromAdmissionNumber } from '@lib/utils/courseUtils';
import { calculateCreditsFromLTP } from '@lib/utils/creditCalculator';
import { getEventKey } from '@lib/utils/eventUtils';

import { DEMO_DISPLAY_NAME, DEMO_EMAIL, DEMO_UID } from './demoSession';
import type { DemoProfile, DemoState } from './types';

import type {
  ActivityItem,
  CalendarEvent,
  ClassSchedule,
  Grade,
  GradesData,
  Notification,
  Semester,
  StudentDirectoryEntry,
  TimeTableCourse,
  User,
  UserFormsData,
} from '@/types';

/** Bump when the seed or DemoState changes, so browsers holding older demo data reseed. */
export const DEMO_STATE_VERSION = 1;

/** Mirrors the default grading scale in AppConfigContext; a test keeps the two in sync. */
export const DEMO_GRADE_POINTS: Record<string, number> = {
  'A+': 10,
  A: 9,
  'B+': 8,
  B: 7,
  'C+': 6,
  C: 5,
  D: 4,
  F: 0,
};

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const CSE = 'COMPUTER SCIENCE AND ENGINEERING';

/** Campus map ids: Central Library, CSE Department, NLHC */
const DEMO_SAVED_PLACE_IDS = ['loc-3', 'loc-7', 'loc-4'];

/** Semester-5 CSE courses in the bundled NEP timetable; they don't clash with each other. */
const PREFERRED_TIMETABLE_CODES = [
  'NCSC507',
  'NCSC508',
  'NCSC509',
  'NCSC595',
  'NCSC510',
  'NCSC511',
  'NCSC512',
];
const MAX_TIMETABLE_COURSES = 7;

// [code, name, L-T-P, grade] for the four semesters the guest has completed
const PAST_SEMESTERS: [string, string, string, string][][] = [
  [
    ['NMCI101', 'Calculus and Differential Equations', '3-1-0', 'A'],
    ['NPHI101', 'Engineering Physics', '3-0-0', 'B+'],
    ['NPHI102', 'Engineering Physics Lab', '0-0-2', 'A+'],
    ['NCSV101', 'Computer Programming', '3-0-0', 'A'],
    ['NCSV102', 'Computer Programming Lab', '0-0-2', 'A+'],
    ['NHSI101', 'English for Technical Communication', '2-0-0', 'B'],
  ],
  [
    ['NMCI102', 'Linear Algebra and Probability', '3-1-0', 'B+'],
    ['NCSC103', 'Data Structures', '3-0-0', 'A'],
    ['NCSC104', 'Data Structures Lab', '0-0-2', 'A+'],
    ['NCSE102', 'Introduction to Algorithms', '3-0-0', 'A'],
    ['NEEI101', 'Basic Electrical Engineering', '3-0-0', 'B'],
    ['NMEI102', 'Engineering Graphics', '0-0-3', 'A'],
  ],
  [
    ['NCSC201', 'Discrete Mathematics', '3-1-0', 'A'],
    ['NCSC202', 'Computer Organization and Architecture', '3-1-0', 'B+'],
    ['NCSC203', 'Design and Analysis of Algorithms', '3-1-0', 'A+'],
    ['NCSC204', 'Algorithms Lab', '0-0-2', 'A+'],
    ['NCSE201', 'Digital Logic Design', '3-0-0', 'A'],
    ['NHSI201', 'Economics for Engineers', '3-0-0', 'B+'],
  ],
  [
    ['NCSC206', 'Database Management Systems', '3-1-0', 'A+'],
    ['NCSC207', 'Theory of Computation', '3-1-0', 'A'],
    ['NCSC208', 'Operating Systems', '3-1-0', 'A'],
    ['NCSC209', 'Database Management Systems Laboratory', '0-0-2', 'A+'],
    ['NCSC210', 'Operating Systems Laboratory', '0-0-2', 'A+'],
    ['NCSE202', 'Object Oriented Programming using Java', '3-0-0', 'A+'],
  ],
];

// Fictional names; a test checks none of them is in the real student directory
const CLASSMATE_NAMES = [
  'Ishaan Kulkarni',
  'Meera Raghavan',
  'Kabir Sethi',
  'Ananya Bhattacharjee',
  'Rohan Deshpande',
  'Tara Venkatesh',
  'Vihaan Chatterjee',
  'Saanvi Iyer',
  'Arjun Malhotra',
  'Diya Nambiar',
  'Reyansh Kapoor',
  'Myra Saxena',
  'Advik Joshi',
  'Kiara Menon',
  'Shaurya Banerjee',
  'Aditi Hegde',
  'Vivaan Bhatia',
  'Navya Krishnan',
  'Dhruv Agarwal',
  'Ira Mukherjee',
  'Arnav Pillai',
  'Anvi Thakur',
  'Krish Reddy',
  'Pari Dutta',
  'Ayaan Khanna',
  'Riya Ganguly',
  'Kian Fernandes',
  'Zara Qureshi',
  'Neil Bose',
  'Sia Rao',
];

const CLASSMATE_BRANCHES = [
  CSE,
  CSE,
  'ELECTRONICS AND COMMUNICATION ENGINEERING',
  'MATHEMATICS AND COMPUTING',
  'ELECTRICAL ENGINEERING',
  'MECHANICAL ENGINEERING',
];

/** Extra details for the first six classmates, who have full public profiles. */
const CLASSMATE_PROFILES: Pick<User, 'bio' | 'interests' | 'hostel'>[] = [
  {
    bio: 'Competitive programmer and chai enthusiast.',
    interests: ['Competitive Programming', 'Chess'],
    hostel: 'Jasper Hostel',
  },
  {
    bio: 'Building robots, one servo at a time.',
    interests: ['Robotics', 'Embedded Systems'],
    hostel: 'Amber Hostel',
  },
  {
    bio: 'Maths nerd. Ask me about graph theory.',
    interests: ['Graph Theory', 'Puzzles'],
    hostel: 'Diamond Hostel',
  },
  {
    bio: 'Designing the next campus app.',
    interests: ['UI Design', 'Photography'],
    hostel: 'Opal Hostel',
  },
  {
    bio: 'Power systems by day, guitar by night.',
    interests: ['Music', 'Renewable Energy'],
    hostel: 'Emerald Hostel',
  },
  {
    bio: 'Formula Student team, chassis lead.',
    interests: ['Motorsport', 'CAD'],
    hostel: 'Topaz Hostel',
  },
];

const round2 = (n: number) => Math.round(n * 100) / 100;

const timestampAt = (ms: number) => ({ seconds: Math.floor(ms / 1000), nanoseconds: 0 });

/** YYYY-MM-DD in local time, the format calendar events use. */
const localDate = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** The guest is always in third year, so the batch follows the academic year (it starts in July). */
export function demoBatchYear(now: Date): number {
  const academicYearStart = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  return academicYearStart - 2;
}

const admissionNumber = (batchYear: number, serial: number) =>
  `${String(batchYear).slice(-2)}JE${9000 + serial}`;

function weightedAverage(grades: Grade[]): number {
  const credits = grades.reduce((sum, g) => sum + g.credits, 0);
  const points = grades.reduce((sum, g) => sum + (DEMO_GRADE_POINTS[g.grade] ?? 0) * g.credits, 0);
  return credits > 0 ? points / credits : 0;
}

function buildGradesData(batchYear: number, courseOption: 'CBCS' | 'NEP'): GradesData {
  const semesters: Semester[] = [];
  const allGrades: Grade[] = [];

  PAST_SEMESTERS.forEach((courses, index) => {
    const grades: Grade[] = courses.map(([subjectCode, subjectName, ltp, grade], i) => ({
      subjectCode,
      subjectName,
      ltp,
      grade,
      credits: calculateCreditsFromLTP(ltp, courseOption),
      attendance: 78 + ((i * 7 + index * 3) % 18),
    }));
    allGrades.push(...grades);

    const sessionStart = batchYear + Math.floor(index / 2);
    semesters.push({
      semester: index + 1,
      sessionYear: `${sessionStart}-${String((sessionStart + 1) % 100).padStart(2, '0')}`,
      sessionType: index % 2 === 0 ? 'Monsoon' : 'Winter',
      sgpa: round2(weightedAverage(grades)),
      cgpa: round2(weightedAverage(allGrades)),
      grades,
    });
  });

  const totalCredits = allGrades.reduce((sum, g) => sum + g.credits, 0);
  const earnedCredits = allGrades
    .filter((g) => g.grade !== 'F')
    .reduce((sum, g) => sum + g.credits, 0);

  return { semesters, cgpa: round2(weightedAverage(allGrades)), totalCredits, earnedCredits };
}

type Slot = TimeTableCourse['slots'][number];

const clashes = (a: Slot, b: Slot) =>
  a.day === b.day && a.startTime < b.endTime && b.startTime < a.endTime;

/** Picks clash-free courses, preferring the list above, so the demo survives timetable edits. */
export function pickDemoCourses(timetable: TimeTableCourse[]): TimeTableCourse[] {
  const withSlots = timetable.filter((c) => c.slots.length > 0);
  const preferred = PREFERRED_TIMETABLE_CODES.map((code) =>
    withSlots.find((c) => c.courseCode === code)
  ).filter((c): c is TimeTableCourse => c !== undefined);
  const rest = withSlots.filter((c) => !PREFERRED_TIMETABLE_CODES.includes(c.courseCode));

  const picked: TimeTableCourse[] = [];
  for (const course of [...preferred, ...rest]) {
    if (picked.length >= MAX_TIMETABLE_COURSES) break;
    const taken = picked.flatMap((c) => c.slots);
    if (course.slots.some((slot) => taken.some((t) => clashes(slot, t)))) continue;
    picked.push(course);
  }
  return picked;
}

function buildSchedule(): ClassSchedule[] {
  // Same slotId format as the Schedule page, so its timetable sync recognises these entries
  const classes: ClassSchedule[] = pickDemoCourses(NEP_TIMETABLE_DATA).flatMap((course) =>
    course.slots.map((slot, index) => ({
      slotId: `${course.courseCode}-${slot.day}-${slot.startTime}-${index}`,
      day: slot.day as ClassSchedule['day'],
      startTime: slot.startTime,
      endTime: slot.endTime,
      courseName: course.courseName,
      courseCode: course.courseCode,
      instructor: 'TBA',
      location: slot.venue,
    }))
  );

  return [
    ...classes,
    {
      slotId: 'custom-task-demo-1',
      day: 'Saturday',
      startTime: '10:00',
      endTime: '12:00',
      courseName: 'Hackathon team sync',
      courseCode: 'Personal',
      instructor: '-',
      location: 'Central Library',
      isCustomTask: true,
    },
  ];
}

function buildUserEvents(nowMs: number): CalendarEvent[] {
  const event = (
    n: number,
    daysFromNow: number,
    description: string,
    remindMe: boolean
  ): CalendarEvent => ({
    id: `demo-event-${n}`,
    date: localDate(nowMs + daysFromNow * DAY_MS),
    description,
    type: 'Other',
    remindMe,
    userId: DEMO_UID,
  });

  return [
    event(1, -3, 'Submitted DBMS mini-project report', false),
    event(2, 2, 'Advanced DBMS lab viva', true),
    event(3, 5, 'Coding club contest', true),
    event(4, 12, 'Internship application deadline', false),
  ];
}

function buildNotifications(nowMs: number): Notification[] {
  const notification = (
    n: number,
    hoursAgo: number,
    read: boolean,
    fields: Pick<Notification, 'title' | 'body' | 'type'> & { link?: string }
  ): Notification => ({
    id: `demo-notification-${n}`,
    createdAt: timestampAt(nowMs - hoursAgo * HOUR_MS),
    read,
    sender: 'College Central',
    ...fields,
  });

  return [
    notification(1, 2, false, {
      title: 'Welcome to the demo!',
      body: 'Everything here is sample data. Change anything you like, then use "Reset demo" to start over.',
      type: 'info',
    }),
    notification(2, 20, false, {
      title: 'Lab moved',
      body: 'This week’s Advanced DBMS Lab is in CSE Lab IV.',
      type: 'warning',
      link: '/schedule',
    }),
    notification(3, 48, true, {
      title: 'Fee payment reminder',
      body: 'Semester fees are due by the end of this month.',
      type: 'warning',
    }),
    notification(4, 72, true, {
      title: 'Coding club contest',
      body: 'Registrations are open for this weekend’s contest.',
      type: 'event',
      link: '/academic-calendar',
    }),
    notification(5, 120, true, {
      title: 'Grades published',
      body: 'Your semester 4 grades are now available.',
      type: 'success',
      link: '/grades',
    }),
    notification(6, 200, true, {
      title: 'Library hours extended',
      body: 'The Central Library stays open until midnight during exams.',
      type: 'info',
    }),
  ];
}

function buildUserForms(nowMs: number): UserFormsData {
  return {
    favorites: ugForms.slice(0, 2).map((f) => f.formNumber),
    recentDownloads: generalForms.slice(0, 2).map((f, i) => ({
      formNumber: f.formNumber,
      title: f.title,
      timestamp: nowMs - (i + 2) * DAY_MS,
    })),
  };
}

function buildActivity(nowMs: number, userForms: UserFormsData): ActivityItem[] {
  const downloaded = userForms.recentDownloads[0]?.title ?? 'a form';
  const favourited = ugForms[0]?.title ?? 'a form';

  const entries: [number, ActivityItem['type'], string, string, string, string?][] = [
    [1, 'login', 'Signed In', 'Started exploring the demo.', '🔑'],
    [
      26,
      'schedule',
      'Timetable Updated',
      'Added Advanced DBMS Lab to your timetable.',
      '🗓️',
      '/schedule',
    ],
    [
      30,
      'reminder',
      'Reminder Set',
      'For event: "Advanced DBMS lab viva"',
      '🔔',
      '/academic-calendar',
    ],
    [52, 'form', 'Form Downloaded', `Downloaded: ${downloaded}`, '📄', '/college-forms'],
    [75, 'map', 'Place Saved', 'Saved "Central Library" to your places.', '⭐', '/campus-map'],
    [100, 'grades', 'Grades Updated', 'Semester 4 grades were added.', '📊', '/grades'],
    [
      150,
      'event',
      'Event Added',
      'Added "Coding club contest" to calendar.',
      '📅',
      '/academic-calendar',
    ],
    [
      200,
      'update',
      'Profile Updated',
      'Your profile information was successfully updated.',
      '✏️',
      '/profile',
    ],
    [
      260,
      'form',
      'Form Favorited',
      `Form "${favourited}" was added to favorites.`,
      '⭐',
      '/college-forms',
    ],
    [330, 'login', 'Account Created', 'Welcome! Your account has been created.', '🎉'],
  ];

  return entries.map(([hoursAgo, type, title, description, icon, link], i) => ({
    id: `demo-activity-seed-${i + 1}`,
    type,
    title,
    description,
    icon,
    ...(link && { link }),
    timestamp: timestampAt(nowMs - hoursAgo * HOUR_MS),
  }));
}

function buildClassmates(batchYear: number): {
  classmates: User[];
  entries: StudentDirectoryEntry[];
} {
  const entries = CLASSMATE_NAMES.map((name, i) => {
    const admNo = admissionNumber(batchYear, i + 2);
    return {
      id: admNo,
      admNo,
      name: name.toUpperCase(),
      branch: CLASSMATE_BRANCHES[i % CLASSMATE_BRANCHES.length]!,
    };
  });

  const classmates: User[] = CLASSMATE_PROFILES.map((details, i) => {
    const entry = entries[i]!;
    return {
      id: `demo-classmate-${i + 1}`,
      name: CLASSMATE_NAMES[i]!,
      role: 'user',
      admissionNumber: entry.admNo,
      branch: entry.branch,
      email: `${entry.admNo.toLowerCase()}@demo.local`,
      phone: '',
      semester: 5,
      courseOption: getCourseOptionFromAdmissionNumber(entry.admNo),
      ...details,
    };
  });

  return { classmates, entries };
}

function buildProfile(batchYear: number, nowMs: number): DemoProfile {
  const admNo = admissionNumber(batchYear, 1);
  const courseOption = getCourseOptionFromAdmissionNumber(admNo);

  return {
    id: DEMO_UID,
    name: DEMO_DISPLAY_NAME,
    role: 'user',
    admissionNumber: admNo,
    branch: CSE,
    hostel: 'Aquamarine Hostel',
    email: DEMO_EMAIL,
    phone: '',
    semester: 5,
    courseOption,
    bio: 'Third-year CSE student exploring College Central. Into backend systems and badminton.',
    interests: ['Web Development', 'Databases', 'Badminton'],
    createdAt: timestampAt(nowMs - 400 * DAY_MS),
    gradeScenarios: [],
    gradesData: buildGradesData(batchYear, courseOption),
    scheduleData: buildSchedule(),
    savedCampusPlaces: [...DEMO_SAVED_PLACE_IDS],
  };
}

export function createDemoSeed(now: Date): DemoState {
  const nowMs = now.getTime();
  const batchYear = demoBatchYear(now);
  const profile = buildProfile(batchYear, nowMs);
  const { classmates, entries } = buildClassmates(batchYear);
  const userForms = buildUserForms(nowMs);
  const userEvents = buildUserEvents(nowMs);

  return {
    version: DEMO_STATE_VERSION,
    seededAt: nowMs,
    profile,
    userForms,
    userEvents,
    reminderEventKeys: userEvents.filter((e) => e.remindMe).map(getEventKey),
    notifications: buildNotifications(nowMs),
    activity: buildActivity(nowMs, userForms),
    classmates,
    directory: [
      {
        id: profile.admissionNumber,
        admNo: profile.admissionNumber,
        name: profile.name.toUpperCase(),
        branch: profile.branch,
      },
      ...entries,
    ],
  };
}
