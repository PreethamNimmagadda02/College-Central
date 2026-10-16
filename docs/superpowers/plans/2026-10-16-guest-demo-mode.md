# Guest Demo Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Visitors without a college email can explore College Central as a guest, using fictional sample data kept in their own browser.

**Architecture:**
- A guest never authenticates with Firebase. Instead, `useAuth` exposes an `isGuest` flag and a frozen stand-in user.
- Every provider, service and page that reads or writes per-user Firestore or Storage data gets an explicit guest branch. That branch uses a localStorage-backed demo store seeded with fictional data.
- Firestore and Storage rules are untouched, so a guest branch that gets missed fails closed: the call is denied and nothing leaks.

**Tech Stack:**
- React 19, TypeScript 5.8 (`strict`, `noUncheckedIndexedAccess`)
- Firebase JS SDK, compat API plus some modular calls
- Vitest 4 with Testing Library (jsdom)
- Playwright

**Spec:** `docs/superpowers/specs/2026-10-16-guest-demo-mode-design.md`

## Global Constraints

- **Rules files:** do not edit `firestore.rules` or `storage.rules`.
- **No Firebase in guest mode:** nothing calls `db`, `auth` or `storage` from `@lib/firebase`, or any `firebase/firestore` function. Every guest test asserts this.
- **Identity constants:** `DEMO_UID = 'demo-guest'`, `DEMO_EMAIL = 'guest@demo.local'`, `DEMO_DISPLAY_NAME = 'Aarav Mehta'`.
- **localStorage keys:** `cc_demo_session` (the guest flag) and `cc_demo_store` (the demo data).
- **User-facing copy, exactly:**

  | Where | Text |
  |---|---|
  | Login button | "Explore as guest" |
  | Login hint | "No college email? Try the app with sample data." |
  | Banner | "You're exploring College Central with sample data." |
  | Banner buttons | "Reset demo", "Exit demo" |
  | Grade-sheet scan | "Grade-sheet scanning isn't available in the demo. You can still edit your grades by hand." |
  | Profile photo | "Profile pictures can't be changed in the demo." |
- **Real-user code:** changes only where a guest branch is added. The one exception is `CalendarContext`, where three identical reminder writes become one helper.
- **Error counts:** type and lint errors must not increase over the baseline recorded in Task 1 Step 1. At planning time that was 45 `tsc` errors and 5 ESLint errors on `main`.
- **Imports:** use the path aliases (`@features/…`, `@contexts/…`, `@services/…`, `@lib/…`, `@config/…`, `@hooks/…`, `@components/…`, `@pages/…`, `@/types`).
- **Tests:**
  - New tests go in `src/__tests__/demo/`.
  - A test that imports the **real** `useAuth` must mock `@lib/firebase`, `@capacitor/core` and `@codetrix-studio/capacitor-google-auth`. This set was verified to load every module touched here.
  - When `useAuth` is mocked, return a **stable** object (hold it in `vi.hoisted`), or effects keyed on `currentUser` will re-run on every render.
- **Commits:** a plain imperative sentence (the repo's style), ending with a blank line and then `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

These are the five failure modes most likely to bite a real visitor. The spec implies them but doesn't spell them out. Each one is pinned by a test in the task that owns the code:

1. **Browser storage full:** a write throws `QuotaExceededError`. The demo should keep working from memory without throwing. *Task 3: "keeps working in memory when storage is full".*
2. **Demo open in two tabs:** a change in one tab should appear in the other, not be silently overwritten by the other tab's next write. *Task 3: "adopts changes made in another tab".*
3. **Guest opens a shared `/u/<real uid>` link:** they should see "User not found", and no Firestore read should happen. *Task 9: "shows User not found for a real user's link".*
4. **Guest tries a backend-only feature** (profile photo upload, grade-sheet scan): they should get a clear demo message, and no Storage or Gemini call should happen. *Task 6: "refuses profile picture uploads"; Task 7: "refuses grade-sheet scanning".*
5. **A student signs in on a browser that still has a guest flag:** the real account should win and the flag should be cleared. *Task 4: "a real sign-in always replaces a leftover guest session".*

---

## File Structure

| File | Responsibility |
|---|---|
| `src/features/demo/demoSession.ts` (new) | The guest flag (`startDemo` / `endDemo` / `isDemoActive`) and the guest identity constants. Depends on nothing. |
| `src/features/demo/types.ts` (new) | `DemoProfile` and `DemoState`. |
| `src/features/demo/demoData.ts` (new) | `createDemoSeed(now)`, which builds all sample data. Pure and deterministic for a given `now`. |
| `src/features/demo/demoStore.ts` (new) | The localStorage-backed store. It provides subscribe, update, reset and lookup functions, and is the only module that touches `cc_demo_store`. |
| `src/features/demo/DemoBanner.tsx` (new) | The banner with "Reset demo" and "Exit demo". |
| `src/features/auth/hooks/useAuth.tsx` | Adds `isGuest`, `enterGuestMode()`, the stand-in user, and guest logout. |
| `src/pages/Login.tsx` | Adds the "Explore as guest" button. |
| `src/services/activityService.ts`, `src/services/locationAnalyticsService.ts` | uid-based guest guards. |
| `src/contexts/{User,AppConfig,Grades,Schedule,CampusMap,Calendar,Forms}Context.tsx`, `src/features/auth/hooks/useRole.tsx` | Guest branches. |
| `src/components/layout/NotificationCenter.tsx`, `src/pages/{Profile,Directory,UserProfile}.tsx` | Guest branches. |
| `src/components/common/{LocationRequirement,SessionGuard}.tsx`, `src/pages/Layout.tsx` | Gate and timeout exemptions, plus the banner. |
| `src/__tests__/demo/*.test.ts(x)` (new), `e2e/guest.spec.ts` (new) | Tests. |
| `src/__tests__/pages/Directory.test.tsx` | Mocks `useAuth`, which `Directory` now uses. |

---

### Task 1: Guest session flag

**Files:**
- Create: `src/features/demo/demoSession.ts`
- Test: `src/__tests__/demo/demoSession.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `DEMO_UID: 'demo-guest'`
  - `DEMO_EMAIL: 'guest@demo.local'`
  - `DEMO_DISPLAY_NAME: 'Aarav Mehta'`
  - `isDemoUid(uid: string | null | undefined): boolean`
  - `isDemoActive(): boolean`
  - `startDemo(): void`
  - `endDemo(): void`

- [ ] **Step 1: Sync dependencies and record the error baseline**

`node_modules` may have been installed from another branch. `main` declares `@google/genai`, and it has to be installed before the Grades code will load.

```bash
npm install
BASE="${TMPDIR:-/tmp}/guest-demo"; mkdir -p "$BASE"
npx tsc --noEmit 2>&1 | grep "error TS" | sed -E 's/\([0-9]+,[0-9]+\)//' | sort > "$BASE/tsc-baseline.txt"
npx eslint src --ext .ts,.tsx --quiet -f unix | grep "\[Error" | sed -E 's/:[0-9]+:[0-9]+:/:/' | sort > "$BASE/eslint-baseline.txt"
wc -l "$BASE/tsc-baseline.txt" "$BASE/eslint-baseline.txt"
```

Expected: about 45 and 5 lines. Line and column numbers are stripped so that later comparisons aren't thrown off by shifted lines.

- [ ] **Step 2: Write the failing test**

`src/__tests__/demo/demoSession.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DEMO_UID,
  endDemo,
  isDemoActive,
  isDemoUid,
  startDemo,
} from '@features/demo/demoSession';

describe('demoSession', () => {
  beforeEach(() => {
    localStorage.clear();
    endDemo();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is inactive by default', () => {
    expect(isDemoActive()).toBe(false);
  });

  it('starts and ends the demo and remembers it across reloads', () => {
    startDemo();
    expect(isDemoActive()).toBe(true);
    expect(localStorage.getItem('cc_demo_session')).toBe('1');

    endDemo();
    expect(isDemoActive()).toBe(false);
    expect(localStorage.getItem('cc_demo_session')).toBeNull();
  });

  it('falls back to memory when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    startDemo();
    expect(isDemoActive()).toBe(true);
    endDemo();
    expect(isDemoActive()).toBe(false);
  });

  it('stays active in this tab when storage is full', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });

    startDemo();
    expect(isDemoActive()).toBe(true);
  });

  it('recognises only the demo uid', () => {
    expect(isDemoUid(DEMO_UID)).toBe(true);
    expect(isDemoUid('k3Jd9sQ0aPz8W1xYvB2nM4cR7tL5')).toBe(false);
    expect(isDemoUid(undefined)).toBe(false);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run src/__tests__/demo/demoSession.test.ts`
Expected: FAIL with `Failed to resolve import "@features/demo/demoSession"`.

- [ ] **Step 4: Implement `demoSession.ts`**

`src/features/demo/demoSession.ts`:

```ts
// Guest demo mode: visitors without a college email explore the app with
// sample data kept in this browser. A guest never signs in to Firebase, so the
// security rules keep protecting real students' data.

/** Stand-in uid for the guest. Real Firebase uids are 28 random characters. */
export const DEMO_UID = 'demo-guest';
export const DEMO_EMAIL = 'guest@demo.local';
export const DEMO_DISPLAY_NAME = 'Aarav Mehta';

const SESSION_KEY = 'cc_demo_session';

// Keeps the demo alive in this tab when localStorage is blocked or full
let memoryFlag = false;

export const isDemoUid = (uid: string | null | undefined): boolean => uid === DEMO_UID;

export function isDemoActive(): boolean {
  if (memoryFlag) return true;
  try {
    return localStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function startDemo(): void {
  memoryFlag = true;
  try {
    localStorage.setItem(SESSION_KEY, '1');
  } catch {
    // Storage blocked or full: the in-memory flag covers this tab
  }
}

export function endDemo(): void {
  memoryFlag = false;
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // Storage blocked: nothing was persisted
  }
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/__tests__/demo/demoSession.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add src/features/demo/demoSession.ts src/__tests__/demo/demoSession.test.ts
git commit -m "$(printf 'Add the guest demo session flag\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>')"
```

---

### Task 2: Demo seed data

**Files:**
- Create: `src/features/demo/types.ts`
- Create: `src/features/demo/demoData.ts`
- Test: `src/__tests__/demo/demoData.test.ts`

**Interfaces:**
- Consumes: `DEMO_UID`, `DEMO_EMAIL` and `DEMO_DISPLAY_NAME` from Task 1.
- Produces:
  - `type DemoProfile = User & { scheduleData?: ClassSchedule[]; savedCampusPlaces?: string[] }`
  - `interface DemoState { version; seededAt; profile; userForms; userEvents; reminderEventKeys; notifications; activity; classmates; directory }` (exact shape below)
  - `DEMO_STATE_VERSION = 1`
  - `DEMO_GRADE_POINTS: Record<string, number>`
  - `demoBatchYear(now: Date): number`
  - `pickDemoCourses(timetable: TimeTableCourse[]): TimeTableCourse[]`
  - `createDemoSeed(now: Date): DemoState`

- [ ] **Step 1: Write the failing test**

`src/__tests__/demo/demoData.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';

// generateDefaultConfig lives in AppConfigContext, which pulls in Firebase and useAuth
vi.mock('@lib/firebase', () => ({ db: {}, auth: {}, storage: {} }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));
vi.mock('@codetrix-studio/capacitor-google-auth', () => ({ GoogleAuth: { initialize: vi.fn() } }));

import { CAMPUS_LOCATIONS } from '@config/campusMap';
import { allForms } from '@config/forms';
import { NEP_TIMETABLE_DATA } from '@config/nepCourseData';
import { STUDENT_DIRECTORY } from '@config/studentDirectory';
import { generateDefaultConfig } from '@contexts/AppConfigContext';
import {
  createDemoSeed,
  DEMO_GRADE_POINTS,
  demoBatchYear,
  pickDemoCourses,
} from '@features/demo/demoData';
import { DEMO_UID } from '@features/demo/demoSession';

const NOW = new Date(2026, 9, 16, 11, 0); // 16 October 2026, 11:00 local time

describe('createDemoSeed', () => {
  it('is deterministic for a given moment', () => {
    expect(createDemoSeed(NOW)).toEqual(createDemoSeed(new Date(NOW)));
  });

  it('makes the guest a third-year NEP student in the current batch', () => {
    const { profile } = createDemoSeed(NOW);
    expect(profile.id).toBe(DEMO_UID);
    expect(profile.admissionNumber).toBe('24JE9001');
    expect(profile.courseOption).toBe('NEP');
    expect(demoBatchYear(new Date(2027, 1, 1))).toBe(2024); // February is the same academic year
    expect(demoBatchYear(new Date(2027, 6, 1))).toBe(2025); // a new batch starts in July
  });

  it('keeps grades internally consistent', () => {
    const gradesData = createDemoSeed(NOW).profile.gradesData!;
    const all = gradesData.semesters.flatMap((s) => s.grades);
    const credits = all.reduce((sum, g) => sum + g.credits, 0);
    const points = all.reduce((sum, g) => sum + DEMO_GRADE_POINTS[g.grade]! * g.credits, 0);

    expect(gradesData.semesters).toHaveLength(4);
    expect(gradesData.cgpa).toBeCloseTo(points / credits, 2);
    expect(gradesData.totalCredits).toBe(credits);
    expect(gradesData.semesters.at(-1)!.cgpa).toBe(gradesData.cgpa);
  });

  it('uses the same grade points as the default grading scale', () => {
    const scale = Object.fromEntries(
      generateDefaultConfig().gradingScale.map((g) => [g.grade, g.points])
    );
    expect(DEMO_GRADE_POINTS).toEqual(scale);
  });

  it('builds a clash-free timetable from real bundled courses', () => {
    const picked = pickDemoCourses(NEP_TIMETABLE_DATA);
    expect(picked.length).toBeGreaterThanOrEqual(5);

    const slots = picked.flatMap((c) => c.slots);
    slots.forEach((a, i) =>
      slots.slice(i + 1).forEach((b) => {
        const clash = a.day === b.day && a.startTime < b.endTime && b.startTime < a.endTime;
        expect(clash).toBe(false);
      })
    );

    const codes = new Set(NEP_TIMETABLE_DATA.map((c) => c.courseCode));
    createDemoSeed(NOW)
      .profile.scheduleData!.filter((s) => !s.isCustomTask)
      .forEach((s) => expect(codes.has(s.courseCode)).toBe(true));
  });

  it('dates personal events relative to now and reminds only for upcoming ones', () => {
    const seed = createDemoSeed(NOW);
    expect(seed.userEvents.map((e) => e.date)).toEqual([
      '2026-10-13',
      '2026-10-18',
      '2026-10-21',
      '2026-10-28',
    ]);
    expect(seed.reminderEventKeys).toEqual([
      '2026-10-18-Advanced DBMS lab viva',
      '2026-10-21-Coding club contest',
    ]);
  });

  it('references real saved places and forms', () => {
    const seed = createDemoSeed(NOW);
    const placeIds = new Set(CAMPUS_LOCATIONS.map((l) => l.id));
    seed.profile.savedCampusPlaces!.forEach((id) => expect(placeIds.has(id)).toBe(true));

    const formNumbers = new Set(allForms.map((f) => f.formNumber));
    seed.userForms.favorites.forEach((n) => expect(formNumbers.has(n)).toBe(true));
  });

  it('never reuses a real student name or admission number', () => {
    const seed = createDemoSeed(NOW);
    const realNames = new Set(STUDENT_DIRECTORY.map((s) => s.name.toUpperCase()));
    const realAdmissionNumbers = new Set(STUDENT_DIRECTORY.map((s) => s.admNo));

    expect(seed.directory).toHaveLength(31);
    seed.directory.forEach((entry) => {
      expect(realNames.has(entry.name)).toBe(false);
      expect(realAdmissionNumbers.has(entry.admNo)).toBe(false);
    });
  });

  it('gives six classmates full profiles that appear in the directory', () => {
    const seed = createDemoSeed(NOW);
    const admissionNumbers = new Set(seed.directory.map((d) => d.admNo));
    expect(seed.classmates).toHaveLength(6);
    seed.classmates.forEach((c) => expect(admissionNumbers.has(c.admissionNumber)).toBe(true));
  });

  it('has two unread notifications and activity newest first', () => {
    const seed = createDemoSeed(NOW);
    expect(seed.notifications.filter((n) => !n.read)).toHaveLength(2);

    const times = seed.activity.map((a) => a.timestamp.seconds);
    expect([...times].sort((a, b) => b - a)).toEqual(times);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/__tests__/demo/demoData.test.ts`
Expected: FAIL with `Failed to resolve import "@features/demo/demoData"`.

- [ ] **Step 3: Add the demo types**

`src/features/demo/types.ts`:

```ts
import type {
  ActivityItem,
  CalendarEvent,
  ClassSchedule,
  Notification,
  StudentDirectoryEntry,
  User,
  UserFormsData,
} from '@/types';

/** The guest's users/{uid} document, including fields the app stores outside the User type. */
export type DemoProfile = User & {
  scheduleData?: ClassSchedule[];
  savedCampusPlaces?: string[];
};

export interface DemoState {
  /** DEMO_STATE_VERSION at seeding time; a stored state with another version is reseeded. */
  version: number;
  seededAt: number;
  profile: DemoProfile;
  userForms: UserFormsData;
  userEvents: CalendarEvent[];
  reminderEventKeys: string[];
  notifications: Notification[];
  activity: ActivityItem[];
  /** Classmates with a full public profile, reachable at /u/:id */
  classmates: User[];
  /** The Directory's Students tab: the guest plus fictional classmates */
  directory: StudentDirectoryEntry[];
}
```

- [ ] **Step 4: Implement `demoData.ts`**

`src/features/demo/demoData.ts`:

```ts
// Sample data for guest demo mode. Every person in it is fictional, and every
// date is relative to the moment the demo is seeded, so it never looks stale.

import { generalForms, ugForms } from '@config/forms';
import { NEP_TIMETABLE_DATA } from '@config/nepCourseData';
import { getCourseOptionFromAdmissionNumber } from '@lib/utils/courseUtils';
import { calculateCreditsFromLTP } from '@lib/utils/creditCalculator';

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

import { DEMO_DISPLAY_NAME, DEMO_EMAIL, DEMO_UID } from './demoSession';
import type { DemoProfile, DemoState } from './types';

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
  { bio: 'Competitive programmer and chai enthusiast.', interests: ['Competitive Programming', 'Chess'], hostel: 'Jasper Hostel' },
  { bio: 'Building robots, one servo at a time.', interests: ['Robotics', 'Embedded Systems'], hostel: 'Amber Hostel' },
  { bio: 'Maths nerd. Ask me about graph theory.', interests: ['Graph Theory', 'Puzzles'], hostel: 'Diamond Hostel' },
  { bio: 'Designing the next campus app.', interests: ['UI Design', 'Photography'], hostel: 'Opal Hostel' },
  { bio: 'Power systems by day, guitar by night.', interests: ['Music', 'Renewable Energy'], hostel: 'Emerald Hostel' },
  { bio: 'Formula Student team, chassis lead.', interests: ['Motorsport', 'CAD'], hostel: 'Topaz Hostel' },
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
  const event = (n: number, daysFromNow: number, description: string, remindMe: boolean): CalendarEvent => ({
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
    [26, 'schedule', 'Timetable Updated', 'Added Advanced DBMS Lab to your timetable.', '🗓️', '/schedule'],
    [30, 'reminder', 'Reminder Set', 'For event: "Advanced DBMS lab viva"', '🔔', '/academic-calendar'],
    [52, 'form', 'Form Downloaded', `Downloaded: ${downloaded}`, '📄', '/college-forms'],
    [75, 'map', 'Place Saved', 'Saved "Central Library" to your places.', '⭐', '/campus-map'],
    [100, 'grades', 'Grades Updated', 'Semester 4 grades were added.', '📊', '/grades'],
    [150, 'event', 'Event Added', 'Added "Coding club contest" to calendar.', '📅', '/academic-calendar'],
    [200, 'update', 'Profile Updated', 'Your profile information was successfully updated.', '✏️', '/profile'],
    [260, 'form', 'Form Favorited', `Form "${favourited}" was added to favorites.`, '⭐', '/college-forms'],
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

function buildClassmates(batchYear: number): { classmates: User[]; entries: StudentDirectoryEntry[] } {
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
    // Same key format as CalendarContext.getEventKey
    reminderEventKeys: userEvents.filter((e) => e.remindMe).map((e) => `${e.date}-${e.description}`),
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
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/__tests__/demo/demoData.test.ts`
Expected: PASS (10 tests).

If "never reuses a real student name" fails, replace the clashing name in `CLASSMATE_NAMES` with another fictional one. At planning time all 31 names were checked against `STUDENT_DIRECTORY`, with no matches.

- [ ] **Step 6: Commit**

```bash
git add src/features/demo/types.ts src/features/demo/demoData.ts src/__tests__/demo/demoData.test.ts
git commit -m "$(printf 'Add fictional seed data for the guest demo\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>')"
```

---

### Task 3: Demo store

**Files:**
- Create: `src/features/demo/demoStore.ts`
- Test: `src/__tests__/demo/demoStore.test.ts`

**Interfaces:**
- Consumes: `createDemoSeed` and `DEMO_STATE_VERSION` (Task 2); `DemoProfile` and `DemoState` (Task 2); `MAX_ACTIVITIES_STORED` from `@lib/utils/constants`.
- Produces:
  - `getDemoState(): DemoState`
  - `updateDemoState(update: (current: DemoState) => DemoState): DemoState`
  - `updateDemoProfile(patch: Partial<DemoProfile>): DemoState`
  - `addDemoActivity(entry: Omit<ActivityItem, 'id' | 'timestamp'>): DemoState`
  - `resetDemoState(): DemoState`
  - `subscribeDemoState(listener: (state: DemoState) => void): () => void`. It calls the listener immediately, like `onSnapshot`.
  - `getDemoUserById(id: string): User | undefined`
  - `getDemoUserByAdmissionNumber(admissionNumber: string): User | undefined`
  - `resetDemoStoreForTests(): void`

- [ ] **Step 1: Write the failing test**

`src/__tests__/demo/demoStore.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEMO_STATE_VERSION } from '@features/demo/demoData';
import { DEMO_UID } from '@features/demo/demoSession';
import {
  addDemoActivity,
  getDemoState,
  getDemoUserByAdmissionNumber,
  getDemoUserById,
  resetDemoState,
  resetDemoStoreForTests,
  subscribeDemoState,
  updateDemoProfile,
  updateDemoState,
} from '@features/demo/demoStore';

const STORE_KEY = 'cc_demo_store';

describe('demoStore', () => {
  beforeEach(() => {
    localStorage.clear();
    resetDemoStoreForTests();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('seeds on first read and persists the seed', () => {
    expect(getDemoState().profile.id).toBe(DEMO_UID);
    expect(JSON.parse(localStorage.getItem(STORE_KEY)!).version).toBe(DEMO_STATE_VERSION);
  });

  it('restores saved changes after a reload', () => {
    updateDemoProfile({ bio: 'Changed in the demo' });
    resetDemoStoreForTests(); // a reload: memory is gone, storage remains
    expect(getDemoState().profile.bio).toBe('Changed in the demo');
  });

  it('reseeds when stored state is corrupt', () => {
    localStorage.setItem(STORE_KEY, '{not json');
    expect(getDemoState().profile.id).toBe(DEMO_UID);
  });

  it('reseeds when stored state comes from another version', () => {
    localStorage.setItem(
      STORE_KEY,
      JSON.stringify({ version: DEMO_STATE_VERSION - 1, profile: { name: 'Stale' } })
    );
    expect(getDemoState().profile.name).toBe('Aarav Mehta');
  });

  it('notifies subscribers immediately and on every change', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeDemoState(listener);
    expect(listener).toHaveBeenCalledTimes(1);

    updateDemoState((s) => ({ ...s, reminderEventKeys: [] }));
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener.mock.calls[1]![0].reminderEventKeys).toEqual([]);

    unsubscribe();
    updateDemoProfile({ bio: 'x' });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('keeps untouched slices referentially stable', () => {
    const before = getDemoState();
    const after = updateDemoProfile({ bio: 'x' });
    expect(after.notifications).toBe(before.notifications);
    expect(after.profile).not.toBe(before.profile);
  });

  it('adds activity newest first, with unique ids, capped at 30', () => {
    for (let i = 0; i < 40; i++) {
      addDemoActivity({ type: 'update', title: `Entry ${i}`, description: '', icon: '✏️' });
    }
    const { activity } = getDemoState();
    expect(activity).toHaveLength(30);
    expect(activity[0]!.title).toBe('Entry 39');
    expect(new Set(activity.map((a) => a.id)).size).toBe(30);
  });

  it('reset discards changes and notifies subscribers', () => {
    updateDemoProfile({ bio: 'Changed' });
    const listener = vi.fn();
    subscribeDemoState(listener);

    resetDemoState();
    expect(getDemoState().profile.bio).not.toBe('Changed');
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('keeps working in memory when storage is full', () => {
    getDemoState();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });

    expect(() => updateDemoProfile({ bio: 'Still works' })).not.toThrow();
    expect(getDemoState().profile.bio).toBe('Still works');
  });

  it('works without any storage at all', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(getDemoState().profile.id).toBe(DEMO_UID);
  });

  it('adopts changes made in another tab', () => {
    const listener = vi.fn();
    subscribeDemoState(listener);

    const otherTab = { ...getDemoState(), reminderEventKeys: ['from-other-tab'] };
    localStorage.setItem(STORE_KEY, JSON.stringify(otherTab));
    window.dispatchEvent(new StorageEvent('storage', { key: STORE_KEY }));

    expect(getDemoState().reminderEventKeys).toEqual(['from-other-tab']);
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ reminderEventKeys: ['from-other-tab'] })
    );
  });

  it('finds the guest and classmates by id or admission number', () => {
    const { classmates } = getDemoState();
    expect(getDemoUserById(DEMO_UID)?.name).toBe('Aarav Mehta');
    expect(getDemoUserByAdmissionNumber(classmates[0]!.admissionNumber)?.id).toBe(classmates[0]!.id);
    expect(getDemoUserById('k3Jd9sQ0aPz8W1xYvB2nM4cR7tL5')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/__tests__/demo/demoStore.test.ts`
Expected: FAIL with `Failed to resolve import "@features/demo/demoStore"`.

- [ ] **Step 3: Implement `demoStore.ts`**

`src/features/demo/demoStore.ts`:

```ts
// The guest's data, kept in this browser. It plays the part Firestore plays for
// real students: providers subscribe to it and write to it.

import { MAX_ACTIVITIES_STORED } from '@lib/utils/constants';

import type { ActivityItem, User } from '@/types';

import { createDemoSeed, DEMO_STATE_VERSION } from './demoData';
import type { DemoProfile, DemoState } from './types';

const STORE_KEY = 'cc_demo_store';

type Listener = (state: DemoState) => void;

let state: DemoState | null = null;
const listeners = new Set<Listener>();
let activitySequence = 0;

function readStored(): DemoState | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoState;
    return parsed?.version === DEMO_STATE_VERSION ? parsed : null;
  } catch {
    // Blocked storage or corrupt JSON: the caller reseeds
    return null;
  }
}

function persist(next: DemoState): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked: the demo keeps working from memory in this tab
  }
}

function publish(next: DemoState): DemoState {
  state = next;
  persist(next);
  listeners.forEach((listener) => listener(next));
  return next;
}

export function getDemoState(): DemoState {
  if (!state) {
    const stored = readStored();
    if (stored) {
      state = stored;
    } else {
      state = createDemoSeed(new Date());
      persist(state);
    }
  }
  return state;
}

export function updateDemoState(update: (current: DemoState) => DemoState): DemoState {
  return publish(update(getDemoState()));
}

export function updateDemoProfile(patch: Partial<DemoProfile>): DemoState {
  return updateDemoState((current) => ({ ...current, profile: { ...current.profile, ...patch } }));
}

export function addDemoActivity(entry: Omit<ActivityItem, 'id' | 'timestamp'>): DemoState {
  const nowMs = Date.now();
  activitySequence += 1;
  const item: ActivityItem = {
    ...entry,
    id: `demo-activity-${nowMs}-${activitySequence}`,
    timestamp: { seconds: Math.floor(nowMs / 1000), nanoseconds: 0 },
  };
  return updateDemoState((current) => ({
    ...current,
    activity: [item, ...current.activity].slice(0, MAX_ACTIVITIES_STORED),
  }));
}

export function resetDemoState(): DemoState {
  return publish(createDemoSeed(new Date()));
}

/** Calls the listener now and after every change, like Firestore's onSnapshot. */
export function subscribeDemoState(listener: Listener): () => void {
  listeners.add(listener);
  listener(getDemoState());
  return () => {
    listeners.delete(listener);
  };
}

export function getDemoUserById(id: string): User | undefined {
  const { profile, classmates } = getDemoState();
  return [profile, ...classmates].find((u) => u.id === id);
}

export function getDemoUserByAdmissionNumber(admissionNumber: string): User | undefined {
  const { profile, classmates } = getDemoState();
  return [profile, ...classmates].find((u) => u.admissionNumber === admissionNumber);
}

// Another tab changed the demo: adopt its state so the tabs don't overwrite each other
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORE_KEY) return;
    const next = readStored();
    if (!next) return;
    state = next;
    listeners.forEach((listener) => listener(next));
  });
}

/** Forgets in-memory state and listeners, as a page reload would. Tests only. */
export function resetDemoStoreForTests(): void {
  state = null;
  listeners.clear();
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/__tests__/demo/demoStore.test.ts`
Expected: PASS (12 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/demo/demoStore.ts src/__tests__/demo/demoStore.test.ts
git commit -m "$(printf 'Add the local store behind the guest demo\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>')"
```

---

### Task 4: Guest mode in auth, and the login button

**Files:**
- Modify: `src/features/auth/hooks/useAuth.tsx`
- Modify: `src/pages/Login.tsx:167` (the `useAuth()` destructure), `:327` (add a handler after `handleGoogleSignIn`), `:1243` (add a button after the Google button's closing `</button>`)
- Test: `src/__tests__/demo/useAuth.guest.test.tsx`

**Interfaces:**
- Consumes: `DEMO_UID`, `DEMO_EMAIL`, `DEMO_DISPLAY_NAME`, `isDemoActive`, `startDemo`, `endDemo` (Task 1).
- Produces:
  - `AuthContextType` gains `isGuest: boolean` and `enterGuestMode: () => void`.
  - For a guest, `currentUser` is a frozen stand-in with `uid === DEMO_UID` and the same object reference every time, `isAuthenticated` is `true`, and `loading` is `false`.

- [ ] **Step 1: Write the failing test**

`src/__tests__/demo/useAuth.guest.test.tsx`:

```tsx
import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const firebaseMock = vi.hoisted(() => {
  const listener: { emit: ((user: unknown) => void) | null } = { emit: null };
  return {
    listener,
    auth: {
      onAuthStateChanged: vi.fn((callback: (user: unknown) => void) => {
        listener.emit = callback;
        return () => {};
      }),
      signOut: vi.fn(),
      currentUser: null,
    },
    db: { collection: vi.fn() },
    storage: {},
  };
});

vi.mock('@lib/firebase', () => ({
  auth: firebaseMock.auth,
  db: firebaseMock.db,
  storage: firebaseMock.storage,
}));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));
vi.mock('@codetrix-studio/capacitor-google-auth', () => ({
  GoogleAuth: { initialize: vi.fn(), signIn: vi.fn() },
}));

import { AuthProvider, useAuth } from '@features/auth/hooks/useAuth';
import { DEMO_UID, endDemo, isDemoActive, startDemo } from '@features/demo/demoSession';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth guest mode', () => {
  beforeEach(() => {
    localStorage.clear();
    endDemo();
    vi.clearAllMocks();
  });

  it('enterGuestMode signs in a stand-in guest without touching Firebase', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => firebaseMock.listener.emit!(null));

    act(() => result.current.enterGuestMode());

    expect(result.current.isGuest).toBe(true);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.currentUser?.uid).toBe(DEMO_UID);
    expect(isDemoActive()).toBe(true);
    expect(firebaseMock.db.collection).not.toHaveBeenCalled();
  });

  it('resumes a guest session after a reload without waiting for Firebase', () => {
    startDemo();
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isGuest).toBe(true);
    expect(result.current.loading).toBe(false);
  });

  it('a real sign-in always replaces a leftover guest session', () => {
    startDemo();
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => firebaseMock.listener.emit!({ uid: 'real-student-uid', email: '24je0001@iitism.ac.in' }));

    expect(result.current.isGuest).toBe(false);
    expect(result.current.currentUser?.uid).toBe('real-student-uid');
    expect(isDemoActive()).toBe(false);
  });

  it('logging out a guest ends the demo without calling Firebase', async () => {
    startDemo();
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => firebaseMock.listener.emit!(null));

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(isDemoActive()).toBe(false);
    expect(firebaseMock.auth.signOut).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/__tests__/demo/useAuth.guest.test.tsx`
Expected: FAIL. `result.current.enterGuestMode is not a function`, and `isGuest` is `undefined`.

- [ ] **Step 3: Add guest mode to `useAuth.tsx`**

Add this import after the existing `import { rateLimitCheck } from '@lib/utils/security';`:

```tsx
import {
  DEMO_DISPLAY_NAME,
  DEMO_EMAIL,
  DEMO_UID,
  endDemo,
  isDemoActive,
  startDemo,
} from '@features/demo/demoSession';
```

Replace the `AuthContextType` interface with:

```tsx
interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  /** True while a visitor explores the demo; guests have no Firebase session. */
  isGuest: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  /** Starts the demo for a visitor without a college email. */
  enterGuestMode: () => void;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}
```

Directly below `const AuthContext = createContext<AuthContextType | undefined>(undefined);`, add:

```tsx
// What the app sees as `currentUser` during the demo. Only identity fields are set;
// guest code paths never call Firebase methods on it.
const DEMO_AUTH_USER = Object.freeze({
  uid: DEMO_UID,
  email: DEMO_EMAIL,
  displayName: DEMO_DISPLAY_NAME,
  photoURL: null,
  phoneNumber: null,
  emailVerified: false,
  isAnonymous: true,
  providerData: [],
}) as unknown as User;
```

In `AuthProvider`, replace the state declarations and the auth effect, from `const [currentUser, setCurrentUser]` through the effect's closing `}, []);`, with:

```tsx
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(isDemoActive);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      GoogleAuth.initialize();
    }
    // onAuthStateChanged is the recommended way to listen for auth changes.
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        // A real sign-in always replaces a leftover guest session
        endDemo();
        setIsGuest(false);
      }
      setCurrentUser(user);
      setLoading(false);
    });
    // Clean up the listener when the component unmounts.
    return unsubscribe;
  }, []);

  const enterGuestMode = () => {
    startDemo();
    setIsGuest(true);
  };
```

At the very start of `logout`, before `try {`, add:

```tsx
    if (isGuest) {
      // A guest has nothing to sign out of; the demo data stays for next time
      endDemo();
      setIsGuest(false);
      return;
    }
```

Replace the provider's `value={{ … }}` object with:

```tsx
      value={{
        currentUser: isGuest ? DEMO_AUTH_USER : currentUser,
        isAuthenticated: isGuest || !!currentUser,
        isGuest,
        login,
        register,
        loginWithGoogle,
        enterGuestMode,
        resetPassword,
        logout,
        loading: isGuest ? false : loading,
      }}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/__tests__/demo/useAuth.guest.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Add the "Explore as guest" button to `Login.tsx`**

At line 167, replace:

```tsx
  const { loginWithGoogle, isAuthenticated, loading: authLoading } = useAuth();
```

with:

```tsx
  const { loginWithGoogle, enterGuestMode, isAuthenticated, loading: authLoading } = useAuth();
```

Directly after the closing `};` of `handleGoogleSignIn`, add:

```tsx
  const handleGuestAccess = () => {
    setError('');
    enterGuestMode();
    // The isAuthenticated effect above then routes the guest to the dashboard
  };
```

Directly after the Google button's closing `</button>`, and before `{/* Trust indicators */}`, add:

```tsx
                    {/* Guest access for visitors without a college email */}
                    <button
                      type="button"
                      onClick={handleGuestAccess}
                      disabled={isGoogleSubmitting}
                      className="mt-4 w-full rounded-xl border border-white/20 bg-white/5 py-3 px-6 text-sm md:text-base font-semibold text-white/90 hover:bg-white/10 hover:border-white/30 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Explore as guest
                    </button>
                    <p className="mt-2 text-center text-xs text-white/50">
                      No college email? Try the app with sample data.
                    </p>
```

`Login.tsx` has no unit test, because its scroll animations rely on browser APIs jsdom lacks. Its behaviour is covered by the Task 11 Playwright spec.

- [ ] **Step 6: Type-check the touched files**

Run: `npx tsc --noEmit 2>&1 | grep -E "useAuth|Login\.tsx|features/demo"`
Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add src/features/auth/hooks/useAuth.tsx src/pages/Login.tsx src/__tests__/demo/useAuth.guest.test.tsx
git commit -m "$(printf 'Let visitors without a college email enter as a guest\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>')"
```

---

### Task 5: Service guards for activity and location analytics

**Files:**
- Modify: `src/services/activityService.ts` (`logActivity`, `cleanupOldActivities`)
- Modify: `src/services/locationAnalyticsService.ts` (`getUserLocationState`, `updateUserLocationState`, `recordLocationVisit`, `getRealTimeCrowdLevels`, `getUserStats`, `getZonePopularTimes`, `updateUserLocation`)
- Test: `src/__tests__/demo/services.guest.test.ts`

**Interfaces:**
- Consumes: `isDemoUid` and `isDemoActive` (Task 1); `addDemoActivity` (Task 3).
- Produces: `logActivity(DEMO_UID, …)` writes to the demo store, and every location function is a no-op for `DEMO_UID`. `LocationContext`, `NativeLocationProvider` and the CampusMap page therefore need no changes.

- [ ] **Step 1: Write the failing test**

`src/__tests__/demo/services.guest.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

const firebaseMock = vi.hoisted(() => ({
  db: { collection: vi.fn(), batch: vi.fn() },
  auth: {},
  storage: {},
}));
vi.mock('@lib/firebase', () => firebaseMock);

import { DEMO_UID, endDemo, startDemo } from '@features/demo/demoSession';
import { getDemoState, resetDemoStoreForTests } from '@features/demo/demoStore';
import { cleanupOldActivities, logActivity } from '@services/activityService';
import {
  DEFAULT_CAMPUS_ZONES,
  getRealTimeCrowdLevels,
  getUserLocationState,
  getUserStats,
  getZonePopularTimes,
  recordLocationVisit,
  updateUserLocation,
  updateUserLocationState,
} from '@services/locationAnalyticsService';

describe('services in guest mode', () => {
  beforeEach(() => {
    localStorage.clear();
    resetDemoStoreForTests();
    endDemo();
    vi.clearAllMocks();
  });

  it('logs guest activity to the demo store', async () => {
    await logActivity(DEMO_UID, {
      type: 'update',
      title: 'Profile Updated',
      description: 'Changed bio',
      icon: '✏️',
    });
    await cleanupOldActivities(DEMO_UID);

    expect(getDemoState().activity[0]!.title).toBe('Profile Updated');
    expect(firebaseMock.db.collection).not.toHaveBeenCalled();
  });

  it('never records location analytics for the guest', async () => {
    const zone = DEFAULT_CAMPUS_ZONES[0]!;

    expect(await getUserLocationState(DEMO_UID)).toBeNull();
    expect(await updateUserLocationState(DEMO_UID, zone.id, 'visit-1')).toBe(false);
    expect(await recordLocationVisit(DEMO_UID, zone)).toBeNull();
    await updateUserLocation(DEMO_UID, { lat: 23.81, lng: 86.44 }, zone.id);
    expect(await getUserStats(DEMO_UID)).toBeNull();

    expect(firebaseMock.db.collection).not.toHaveBeenCalled();
  });

  it('shows sample crowd data while the demo is active', async () => {
    startDemo();

    const levels = await getRealTimeCrowdLevels();
    expect(levels).toHaveLength(DEFAULT_CAMPUS_ZONES.length);
    expect(new Set(levels.map((l) => l.level)).size).toBeGreaterThan(1);
    expect(await getZonePopularTimes(DEFAULT_CAMPUS_ZONES[0]!.id)).toHaveLength(24);

    expect(firebaseMock.db.collection).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/__tests__/demo/services.guest.test.ts`
Expected: FAIL. `db.collection` is called (the mock returns `undefined`, so the services log errors), and the activity assertion fails.

- [ ] **Step 3: Guard `activityService.ts`**

Add these imports after `import { db } from '@lib/firebase';`:

```ts
import { isDemoUid } from '@features/demo/demoSession';
import { addDemoActivity } from '@features/demo/demoStore';
```

In `logActivity`, directly after the `if (!userId) { … }` block, add:

```ts
  if (isDemoUid(userId)) {
    // Guests keep their activity feed in the local demo store
    addDemoActivity(activity);
    return;
  }
```

In `cleanupOldActivities`, directly after the `if (!userId) { … }` block, add:

```ts
  if (isDemoUid(userId)) return; // the demo store caps its own feed
```

- [ ] **Step 4: Guard `locationAnalyticsService.ts`**

Add this import after `import { CAMPUS_LOCATIONS } from '@/config/campusMap';`:

```ts
import { isDemoActive, isDemoUid } from '@features/demo/demoSession';
```

Add a guard as the first statement of each function below, before its `try {`:

| Function | First statement |
|---|---|
| `getUserLocationState(userId)` | `if (isDemoUid(userId)) return null;` |
| `updateUserLocationState(userId, …)` | `if (isDemoUid(userId)) return false;` |
| `recordLocationVisit(userId, zone)` | `if (isDemoUid(userId)) return null;` |
| `getUserStats(userId)` | `if (isDemoUid(userId)) return null;` |
| `updateUserLocation(userId, …)` | `if (isDemoUid(userId)) return;` |

Directly after the `LiveZoneStatus` interface, and before `getRealTimeCrowdLevels`, add:

```ts
const DEMO_CROWD_PATTERN: CrowdLevel[] = ['busy', 'moderate', 'quiet', 'moderate', 'quiet', 'busy', 'quiet'];

/** Fixed, varied crowd levels so the demo map doesn't show every zone as quiet. */
function demoCrowdLevels(): LiveZoneStatus[] {
  const now = new Date();
  return DEFAULT_CAMPUS_ZONES.map((zone, i) => {
    const level = DEMO_CROWD_PATTERN[i % DEMO_CROWD_PATTERN.length]!;
    const visitorCount = level === 'busy' ? 35 + (i % 10) : level === 'moderate' ? 12 + (i % 8) : i % 5;
    return { zoneId: zone.id, level, visitorCount, lastUpdated: now };
  });
}
```

Make the first statement of `getRealTimeCrowdLevels()` (before `try {`):

```ts
  if (isDemoActive()) return demoCrowdLevels();
```

Directly above `getZonePopularTimes`, add the helper. Its body is the mock generator that today sits inline in the `snapshot.empty` branch:

```ts
/** A plausible busy-afternoon curve, used when there's no real data and in the demo. */
function samplePopularTimes(): { hour: number; level: number }[] {
  return Array.from({ length: 24 }, (_, i) => {
    // Generate a bell curve-ish pattern peaking at 2 PM (14)
    const dist = Math.abs(i - 14);
    let val = Math.max(10, 100 - dist * 10);
    if (i < 8 || i > 22) val = Math.max(5, val * 0.1);
    return { hour: i, level: Math.floor(val * (0.5 + Math.random() * 0.5)) };
  });
}
```

In `getZonePopularTimes`, make the first statement (before `try {`):

```ts
  if (isDemoActive()) return samplePopularTimes();
```

Then replace the inline mock inside it:

```ts
    if (snapshot.empty) {
      // Return mock data if empty so UI looks good for demo
      return Array.from({ length: 24 }, (_, i) => {
        // Generate a bell curve-ish pattern peaking at 2 PM (14)
        const dist = Math.abs(i - 14);
        let val = Math.max(10, 100 - dist * 10);
        if (i < 8 || i > 22) val = Math.max(5, val * 0.1);
        return { hour: i, level: Math.floor(val * (0.5 + Math.random() * 0.5)) };
      });
    }
```

with:

```ts
    if (snapshot.empty) {
      return samplePopularTimes();
    }
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/__tests__/demo/services.guest.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/services/activityService.ts src/services/locationAnalyticsService.ts src/__tests__/demo/services.guest.test.ts
git commit -m "$(printf 'Keep guest activity local and skip location tracking for guests\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>')"
```

---

### Task 6: Profile, role and app config for guests

**Files:**
- Modify: `src/contexts/UserContext.tsx`
- Modify: `src/features/auth/hooks/useRole.tsx`
- Modify: `src/contexts/AppConfigContext.tsx`
- Test: `src/__tests__/demo/accountProviders.guest.test.tsx`

**Interfaces:**
- Consumes:
  - `useAuth().isGuest` (Task 4)
  - `DEMO_UID` (Task 1)
  - `subscribeDemoState`, `updateDemoProfile` and `getDemoState` (Task 3)
- Produces:
  - **`UserContext`:** for a guest, `user` is the demo profile, `updateUser` writes to the store, and `uploadProfilePicture` rejects with "Profile pictures can't be changed in the demo."
  - **`useRole`:** for a guest, `isAdmin` is false.
  - **`AppConfigContext`:** for a guest, `config` is `generateDefaultConfig()` with `students` replaced by the demo `directory`, and nothing is read from Firestore.

- [ ] **Step 1: Write the failing test**

`src/__tests__/demo/accountProviders.guest.test.tsx`:

```tsx
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const firebaseMock = vi.hoisted(() => ({
  db: { collection: vi.fn(), runTransaction: vi.fn(), batch: vi.fn() },
  auth: { onAuthStateChanged: vi.fn(() => () => {}), currentUser: null, signOut: vi.fn() },
  storage: { ref: vi.fn(), refFromURL: vi.fn() },
}));
const configServiceMock = vi.hoisted(() => ({
  subscribeToConfig: vi.fn(() => () => {}),
  initializeConfig: vi.fn(() => Promise.resolve()),
}));
const authMock = vi.hoisted(() => ({
  value: {
    isGuest: true,
    isAuthenticated: true,
    loading: false,
    currentUser: { uid: 'demo-guest', email: 'guest@demo.local' },
  },
}));

vi.mock('@lib/firebase', () => firebaseMock);
vi.mock('@services/configService', () => configServiceMock);
vi.mock('@features/auth/hooks/useAuth', () => ({ useAuth: () => authMock.value }));

import { STUDENT_DIRECTORY } from '@config/studentDirectory';
import { AppConfigProvider, generateDefaultConfig, useAppConfig } from '@contexts/AppConfigContext';
import { UserProvider, useUser } from '@contexts/UserContext';
import { RoleProvider, useRole } from '@features/auth/hooks/useRole';
import { getDemoState, resetDemoStoreForTests } from '@features/demo/demoStore';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppConfigProvider>
    <UserProvider>
      <RoleProvider>{children}</RoleProvider>
    </UserProvider>
  </AppConfigProvider>
);

const renderAccount = () =>
  renderHook(() => ({ user: useUser(), config: useAppConfig(), role: useRole() }), { wrapper });

describe('account providers in guest mode', () => {
  beforeEach(() => {
    localStorage.clear();
    resetDemoStoreForTests();
    vi.clearAllMocks();
  });

  it('loads the demo profile and saves edits locally', async () => {
    const { result } = renderAccount();
    await waitFor(() => expect(result.current.user.user?.name).toBe('Aarav Mehta'));

    await act(() => result.current.user.updateUser({ bio: 'Edited in the demo' }));

    expect(result.current.user.user?.bio).toBe('Edited in the demo');
    expect(getDemoState().activity[0]!.title).toBe('Profile Updated');
    expect(firebaseMock.db.collection).not.toHaveBeenCalled();
    expect(firebaseMock.db.runTransaction).not.toHaveBeenCalled();
    expect(firebaseMock.auth.onAuthStateChanged).not.toHaveBeenCalled();
  });

  it('refuses profile picture uploads without touching Storage', async () => {
    const { result } = renderAccount();
    await waitFor(() => expect(result.current.user.user).not.toBeNull());

    const photo = new File(['x'], 'me.png', { type: 'image/png' });
    await expect(result.current.user.uploadProfilePicture(photo)).rejects.toThrow(
      "Profile pictures can't be changed in the demo."
    );
    expect(firebaseMock.storage.ref).not.toHaveBeenCalled();
  });

  it('serves bundled config with fictional classmates instead of real students', async () => {
    const { result } = renderAccount();
    await waitFor(() => expect(result.current.config.loading).toBe(false));

    const { students, courses } = result.current.config.config;
    expect(students).toEqual(getDemoState().directory);
    expect(students.some((s) => s.admNo === STUDENT_DIRECTORY[0]!.admNo)).toBe(false);
    expect(courses).toHaveLength(generateDefaultConfig().courses.length);
    expect(configServiceMock.subscribeToConfig).not.toHaveBeenCalled();
    expect(configServiceMock.initializeConfig).not.toHaveBeenCalled();
  });

  it('never grants a guest the admin role', async () => {
    const { result } = renderAccount();
    await waitFor(() => expect(result.current.role.isLoading).toBe(false));

    expect(result.current.role.isAdmin).toBe(false);
    expect(firebaseMock.db.collection).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/__tests__/demo/accountProviders.guest.test.tsx`
Expected: FAIL. `user` stays `null` (`UserContext` waits on `auth.onAuthStateChanged`), and `subscribeToConfig` is called.

- [ ] **Step 3: Guest branch in `UserContext.tsx`**

Add these imports after `import { auth, db, storage } from '@lib/firebase';`:

```tsx
import { useAuth } from '@features/auth/hooks/useAuth';
import { DEMO_UID } from '@features/demo/demoSession';
import { subscribeDemoState, updateDemoProfile } from '@features/demo/demoStore';
```

As the first line inside `UserProvider`, add:

```tsx
  const { isGuest } = useAuth();
```

Make the main effect's first statement the guest branch below. The rest of the existing body stays as it is. Change the dependency array from `[]` to `[isGuest]`:

```tsx
  useEffect(() => {
    if (isGuest) {
      // Guests read their profile from the local demo store; Firebase is never touched
      return subscribeDemoState((state) => {
        setUser(state.profile);
        setError(null);
        setLoading(false);
      });
    }

    let unsubscribeFromFirestore: (() => void) | null = null;
    // ... existing body unchanged ...
  }, [isGuest]);
```

Replace `updateUser` with:

```tsx
  const updateUser = useCallback(
    async (newDetails: Partial<User>) => {
      const currentUserId = isGuest ? DEMO_UID : auth.currentUser?.uid;
      if (currentUserId) {
        try {
          if (isGuest) {
            updateDemoProfile(newDetails);
          } else {
            const userDocRef = db.collection('users').doc(currentUserId); // Use compat API
            await userDocRef.update(newDetails); // Use compat API
          }

          if (!newDetails.profilePicture) {
            await logActivity(currentUserId, {
              type: 'update',
              title: 'Profile Updated',
              description: 'Your profile information was successfully updated.',
              icon: '✏️',
              link: '/profile',
            });
          }
        } catch (e) {
          console.error('Failed to update user:', e);
          setError(e instanceof Error ? e : new Error('Failed to update profile.'));
          throw e;
        }
      }
    },
    [isGuest]
  );
```

In `uploadProfilePicture`, make the first statement of the async function:

```tsx
      if (isGuest) {
        throw new Error("Profile pictures can't be changed in the demo.");
      }
```

Then change its dependency array to `[user, updateUser, isGuest]`.

- [ ] **Step 4: Guest branch in `useRole.tsx`**

Replace:

```tsx
  const { currentUser, loading: authLoading } = useAuth();
```

with:

```tsx
  const { currentUser, loading: authLoading, isGuest } = useAuth();
```

Replace:

```tsx
      // No authenticated user
      if (!currentUser || !currentUser.email) {
```

with:

```tsx
      // No authenticated user, or a guest exploring the demo
      if (!currentUser || !currentUser.email || isGuest) {
```

Change the effect's dependency array to `[currentUser, authLoading, userLoading, configLoading, isGuest]`.

- [ ] **Step 5: Guest branch in `AppConfigContext.tsx`**

Add these imports after `import { AdminConfig } from '@features/admin/types';`:

```tsx
import { useAuth } from '@features/auth/hooks/useAuth';
import { getDemoState } from '@features/demo/demoStore';
```

As the first line inside `AppConfigProvider`, add:

```tsx
  const { isGuest } = useAuth();
```

Give the effect this first statement and change its dependency array from `[]` to `[isGuest]`:

```tsx
  useEffect(() => {
    if (isGuest) {
      // Guests get the bundled config with fictional classmates in place of the real
      // student list, so the demo makes no Firebase calls at all
      setConfig({ ...generateDefaultConfig(), students: getDemoState().directory });
      setIsFirestoreConfig(false);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    // ... existing body unchanged ...
  }, [isGuest]);
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run src/__tests__/demo/accountProviders.guest.test.tsx src/__tests__/demo/demoData.test.ts`
Expected: PASS (4 + 10 tests). `demoData.test.ts` is re-run because it imports `AppConfigContext`, which now imports `useAuth`.

- [ ] **Step 7: Commit**

```bash
git add src/contexts/UserContext.tsx src/features/auth/hooks/useRole.tsx src/contexts/AppConfigContext.tsx src/__tests__/demo/accountProviders.guest.test.tsx
git commit -m "$(printf 'Serve the guest profile and config from the demo store\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>')"
```

---

### Task 7: Grades, timetable and saved places

**Files:**
- Modify: `src/contexts/GradesContext.tsx`
- Modify: `src/contexts/ScheduleContext.tsx`
- Modify: `src/contexts/CampusMapContext.tsx`
- Test: `src/__tests__/demo/studyProviders.guest.test.tsx`

**Interfaces:**
- Consumes:
  - `useAuth().isGuest` (Task 4)
  - `subscribeDemoState` and `updateDemoProfile` (Task 3)
  - the Task 5 service guards: `getRealTimeCrowdLevels` returns sample data while `isDemoActive()`
- Produces:
  - `useGrades()`, `useSchedule()` and `useCampusMap()` read and write `profile.gradesData`, `profile.scheduleData` and `profile.savedCampusPlaces` in the store for guests.
  - `processGrades()` sets the demo message as `error`.

- [ ] **Step 1: Write the failing test**

`src/__tests__/demo/studyProviders.guest.test.tsx`:

```tsx
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const firebaseMock = vi.hoisted(() => ({
  db: { collection: vi.fn(), runTransaction: vi.fn(), batch: vi.fn() },
  auth: { onAuthStateChanged: vi.fn(() => () => {}), currentUser: null, signOut: vi.fn() },
  storage: { ref: vi.fn(), refFromURL: vi.fn() },
}));
const authMock = vi.hoisted(() => ({
  value: {
    isGuest: true,
    isAuthenticated: true,
    loading: false,
    currentUser: { uid: 'demo-guest', email: 'guest@demo.local' },
  },
}));

vi.mock('@lib/firebase', () => firebaseMock);
vi.mock('@services/configService', () => ({
  subscribeToConfig: vi.fn(() => () => {}),
  initializeConfig: vi.fn(() => Promise.resolve()),
}));
vi.mock('@features/auth/hooks/useAuth', () => ({ useAuth: () => authMock.value }));

import { AppConfigProvider } from '@contexts/AppConfigContext';
import { CampusMapProvider, useCampusMap } from '@contexts/CampusMapContext';
import { GradesProvider, useGrades } from '@contexts/GradesContext';
import { ScheduleProvider, useSchedule } from '@contexts/ScheduleContext';
import { endDemo, startDemo } from '@features/demo/demoSession';
import { getDemoState, resetDemoStoreForTests } from '@features/demo/demoStore';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppConfigProvider>
    <GradesProvider>
      <ScheduleProvider>
        <CampusMapProvider>{children}</CampusMapProvider>
      </ScheduleProvider>
    </GradesProvider>
  </AppConfigProvider>
);

describe('study providers in guest mode', () => {
  beforeEach(() => {
    localStorage.clear();
    resetDemoStoreForTests();
    startDemo();
    vi.clearAllMocks();
  });

  afterEach(() => {
    endDemo();
  });

  it('reads and writes the timetable locally', async () => {
    const { result } = renderHook(() => useSchedule(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.scheduleData).toEqual(getDemoState().profile.scheduleData);

    const trimmed = result.current.scheduleData!.slice(1);
    await act(() => result.current.setScheduleData(trimmed));

    expect(getDemoState().profile.scheduleData).toEqual(trimmed);
    expect(result.current.scheduleData).toEqual(trimmed);
    expect(firebaseMock.db.collection).not.toHaveBeenCalled();
  });

  it('reads and clears grades locally but refuses grade-sheet scanning', async () => {
    const { result } = renderHook(() => useGrades(), { wrapper });
    await waitFor(() => expect(result.current.gradesData?.semesters).toHaveLength(4));

    await act(() => result.current.processGrades());
    expect(result.current.error).toBe(
      "Grade-sheet scanning isn't available in the demo. You can still edit your grades by hand."
    );
    expect(result.current.isProcessing).toBe(false);

    await act(() => result.current.resetGradesState());
    expect(result.current.gradesData).toBeNull();
    expect(getDemoState().activity[0]!.title).toBe('Grades Data Cleared');
    expect(firebaseMock.db.collection).not.toHaveBeenCalled();
    expect(firebaseMock.storage.refFromURL).not.toHaveBeenCalled();
  });

  it('saves campus places locally and shows sample crowd levels', async () => {
    const { result } = renderHook(() => useCampusMap(), { wrapper });
    await waitFor(() =>
      expect(result.current.savedPlaces).toEqual(getDemoState().profile.savedCampusPlaces)
    );

    await act(() => result.current.toggleSavePlace('loc-1'));

    expect(getDemoState().profile.savedCampusPlaces).toContain('loc-1');
    await waitFor(() => expect(result.current.liveZoneStatus.length).toBeGreaterThan(0));
    expect(firebaseMock.db.collection).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/__tests__/demo/studyProviders.guest.test.tsx`
Expected: FAIL with `TypeError: Cannot read properties of undefined (reading 'doc')`, because the providers call `db.collection('users')`.

- [ ] **Step 3: Guest branches in `ScheduleContext.tsx`**

Add this import after `import { db } from '@lib/firebase';`:

```tsx
import { subscribeDemoState, updateDemoProfile } from '@features/demo/demoStore';
```

Replace `const { currentUser } = useAuth();` with `const { currentUser, isGuest } = useAuth();`.

Give the effect this first statement and change its dependency array to `[currentUser, isGuest]`:

```tsx
  useEffect(() => {
    if (isGuest) {
      return subscribeDemoState((state) => {
        setScheduleDataState(state.profile.scheduleData ?? null);
        setError(null);
        setLoading(false);
      });
    }

    let unsubscribe: (() => void) | null = null;
    // ... existing body unchanged ...
  }, [currentUser, isGuest]);
```

Replace `setScheduleData` with:

```tsx
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
```

- [ ] **Step 4: Guest branches in `GradesContext.tsx`**

Add this import after `import { logActivity } from '@services/activityService';`:

```tsx
import { subscribeDemoState, updateDemoProfile } from '@features/demo/demoStore';
```

Directly above `const GradesContext = createContext…`, add:

```tsx
const DEMO_SCAN_UNAVAILABLE =
  "Grade-sheet scanning isn't available in the demo. You can still edit your grades by hand.";
```

Replace `const { currentUser } = useAuth();` with `const { currentUser, isGuest } = useAuth();`.

Give the load effect this first statement and change its dependency array to `[currentUser, isGuest]`:

```tsx
  useEffect(() => {
    if (isGuest) {
      return subscribeDemoState((state) => {
        setGradesDataState(state.profile.gradesData ?? null);
        setLoading(false);
      });
    }

    let unsubscribe: (() => void) | null = null;
    // ... existing body unchanged ...
  }, [currentUser, isGuest]);
```

Replace `setGradesData` with:

```tsx
  const setGradesData = useCallback(
    async (data: GradesData | null) => {
      if (isGuest) {
        updateDemoProfile({ gradesData: data ?? undefined });
        return;
      }
      if (currentUser) {
        try {
          const userDocRef = db.collection('users').doc(currentUser.uid);
          await userDocRef.update({ gradesData: data });
        } catch (error) {
          console.error('Error updating grades data:', error);
          setError('Failed to save grades data. Please try again.');
          throw error;
        }
      }
    },
    [currentUser, isGuest]
  );
```

In `processGrades`, make the first statement:

```tsx
    if (isGuest) {
      // Scanning uploads to Storage and calls Gemini, so it stays off in the demo
      setError(DEMO_SCAN_UNAVAILABLE);
      return;
    }
```

Then add `isGuest` to its dependency array. `resetGradesState` needs no change: the demo has no `gradeSheetUrl`, and its `logActivity` and `setGradesData` calls are already guest-aware.

- [ ] **Step 5: Guest branches in `CampusMapContext.tsx`**

Add this import after `import { logActivity } from '@services/activityService';`:

```tsx
import { subscribeDemoState, updateDemoProfile } from '@features/demo/demoStore';
```

Replace `const { currentUser } = useAuth();` with `const { currentUser, isGuest } = useAuth();`.

In the effect commented `// Load user's saved places from Firestore`, insert this after its `if (!currentUser) { … return; }` block, and change its dependency array to `[currentUser, isGuest]`:

```tsx
    if (isGuest) {
      return subscribeDemoState((state) => {
        setSavedPlaces(state.profile.savedCampusPlaces ?? []);
        setLoading(false);
      });
    }
```

In `toggleSavePlace`, replace:

```tsx
        const userDocRef = db.collection('users').doc(currentUser.uid);
        await userDocRef.update({
          savedCampusPlaces: newSaved,
        });
```

with:

```tsx
        if (isGuest) {
          updateDemoProfile({ savedCampusPlaces: newSaved });
        } else {
          const userDocRef = db.collection('users').doc(currentUser.uid);
          await userDocRef.update({
            savedCampusPlaces: newSaved,
          });
        }
```

Then change its dependency array to `[currentUser, isGuest, savedPlaces, locations]`. The live-status effect needs no change, because `getRealTimeCrowdLevels` handles the demo itself (Task 5).

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run src/__tests__/demo/studyProviders.guest.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 7: Commit**

```bash
git add src/contexts/GradesContext.tsx src/contexts/ScheduleContext.tsx src/contexts/CampusMapContext.tsx src/__tests__/demo/studyProviders.guest.test.tsx
git commit -m "$(printf 'Keep guest grades, timetable and saved places local\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>')"
```

---

### Task 8: Calendar events, reminders and forms

**Files:**
- Modify: `src/contexts/CalendarContext.tsx`
- Modify: `src/contexts/FormsContext.tsx`
- Test: `src/__tests__/demo/calendarForms.guest.test.tsx`

**Interfaces:**
- Consumes: `useAuth().isGuest` (Task 4); `getDemoState`, `subscribeDemoState` and `updateDemoState` (Task 3).
- Produces:
  - `useCalendar()`: add, update and delete user events, plus reminder toggles, all work against `userEvents` and `reminderEventKeys` in the store for guests.
  - `useForms()`: favourites and downloads are kept in `userForms`.

- [ ] **Step 1: Write the failing test**

`src/__tests__/demo/calendarForms.guest.test.tsx`:

```tsx
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const firebaseMock = vi.hoisted(() => ({
  db: { collection: vi.fn(), runTransaction: vi.fn(), batch: vi.fn() },
  auth: { onAuthStateChanged: vi.fn(() => () => {}), currentUser: null, signOut: vi.fn() },
  storage: { ref: vi.fn(), refFromURL: vi.fn() },
}));
const authMock = vi.hoisted(() => ({
  value: {
    isGuest: true,
    isAuthenticated: true,
    loading: false,
    currentUser: { uid: 'demo-guest', email: 'guest@demo.local' },
  },
}));

vi.mock('@lib/firebase', () => firebaseMock);
vi.mock('@services/configService', () => ({
  subscribeToConfig: vi.fn(() => () => {}),
  initializeConfig: vi.fn(() => Promise.resolve()),
}));
vi.mock('@features/auth/hooks/useAuth', () => ({ useAuth: () => authMock.value }));

import { allForms } from '@config/forms';
import { AppConfigProvider } from '@contexts/AppConfigContext';
import { CalendarProvider, useCalendar } from '@contexts/CalendarContext';
import { FormsProvider, useForms } from '@contexts/FormsContext';
import { DEMO_UID } from '@features/demo/demoSession';
import { getDemoState, resetDemoStoreForTests } from '@features/demo/demoStore';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppConfigProvider>
    <CalendarProvider>
      <FormsProvider>{children}</FormsProvider>
    </CalendarProvider>
  </AppConfigProvider>
);

const inDays = (days: number) => {
  const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

describe('calendar and forms in guest mode', () => {
  beforeEach(() => {
    localStorage.clear();
    resetDemoStoreForTests();
    vi.clearAllMocks();
  });

  it('keeps the seeded reminders on first load', async () => {
    const { result } = renderHook(() => useCalendar(), { wrapper });
    await waitFor(() => expect(result.current.calendarData).not.toBeNull());
    expect(result.current.reminderPreferences).toEqual(getDemoState().reminderEventKeys);
    expect(getDemoState().reminderEventKeys).toHaveLength(2);
  });

  it('adds, updates and deletes personal events in the demo store', async () => {
    const date = inDays(10);
    const key = `${date}-Mock interview`;
    const { result } = renderHook(() => useCalendar(), { wrapper });
    await waitFor(() => expect(result.current.calendarData).not.toBeNull());

    await act(() => result.current.addUserEvent({ date, description: 'Mock interview', type: 'Other' }));
    const added = getDemoState().userEvents.find((e) => e.description === 'Mock interview')!;
    expect(added.userId).toBe(DEMO_UID);
    await waitFor(() =>
      expect(result.current.calendarData?.events.some((e) => e.description === 'Mock interview')).toBe(true)
    );

    await act(() => result.current.updateUserEvent(added.id!, { ...added, remindMe: true }));
    expect(getDemoState().reminderEventKeys).toContain(key);

    await act(() => result.current.deleteUserEvent(added.id!));
    expect(getDemoState().userEvents.some((e) => e.id === added.id)).toBe(false);
    expect(getDemoState().reminderEventKeys).not.toContain(key);
    expect(firebaseMock.db.collection).not.toHaveBeenCalled();
  });

  it('keeps favourite forms and downloads in the demo store', async () => {
    const { result } = renderHook(() => useForms(), { wrapper });
    await waitFor(() => expect(result.current.userFormsData).toEqual(getDemoState().userForms));

    const form = allForms.find((f) => !getDemoState().userForms.favorites.includes(f.formNumber))!;
    await act(() => result.current.toggleFavorite(form.formNumber));
    expect(getDemoState().userForms.favorites).toContain(form.formNumber);

    await act(() => result.current.addRecentDownload(form));
    expect(getDemoState().userForms.recentDownloads[0]!.formNumber).toBe(form.formNumber);
    expect(firebaseMock.db.collection).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/__tests__/demo/calendarForms.guest.test.tsx`
Expected: FAIL with `TypeError: Cannot read properties of undefined (reading 'where')`, because `db.collection('userEvents')` returns `undefined`.

- [ ] **Step 3: Guest branches in `CalendarContext.tsx`**

Add this import after `import { logActivity } from '@services/activityService';`:

```tsx
import { getDemoState, subscribeDemoState, updateDemoState } from '@features/demo/demoStore';
```

Replace `const { currentUser } = useAuth();` with `const { currentUser, isGuest } = useAuth();`.

**(a)** In the `// Load user's custom events from Firebase` effect, insert this after the `if (!currentUser) { … return; }` block, and change its dependency array to `[currentUser, isGuest]`:

```tsx
    if (isGuest) {
      return subscribeDemoState((state) => setUserEvents(state.userEvents));
    }
```

**(b)** In the `// Load user's reminder preferences` effect, insert this after the `if (!currentUser) { … return; }` block, and change its dependency array to `[currentUser, isGuest]`:

```tsx
    if (isGuest) {
      return subscribeDemoState((state) => setReminderPreferences(state.reminderEventKeys));
    }
```

**(c)** Directly above `// Toggle reminder preference for an event`, add the helper that the three reminder writes will share:

```tsx
  // Reminder keys live in the demo store for guests and in Firestore for everyone else
  const saveReminderKeys = useCallback(
    async (keys: string[]) => {
      if (!currentUser) return;
      if (isGuest) {
        updateDemoState((state) => ({ ...state, reminderEventKeys: keys }));
        return;
      }
      await db.collection('userReminderPreferences').doc(currentUser.uid).set({
        userId: currentUser.uid,
        reminderEventKeys: keys,
      });
    },
    [currentUser, isGuest]
  );
```

**(d)** In `toggleReminderPreference`, replace:

```tsx
        const prefDocRef = db.collection('userReminderPreferences').doc(currentUser.uid);
        await prefDocRef.set({
          userId: currentUser.uid,
          reminderEventKeys: newPreferences,
        });
```

with `await saveReminderKeys(newPreferences);`, and change its dependency array to `[currentUser, reminderPreferences, saveReminderKeys]`.

**(e)** In `cleanupPastEventReminders`, replace:

```tsx
        const prefDocRef = db.collection('userReminderPreferences').doc(currentUser.uid);
        await prefDocRef.set({
          userId: currentUser.uid,
          reminderEventKeys: updatedPreferences,
        });
```

with `await saveReminderKeys(updatedPreferences);`, and add `saveReminderKeys` to its dependency array.

**(f)** Replace the effect that runs the cleanup with:

```tsx
  // Run reminder cleanup when calendar data or reminders change
  useEffect(() => {
    // Guests' reminders are seeded fresh, and the demo store loads synchronously, which
    // would let this run before their events are merged in and wrongly drop the reminders
    if (!currentUser || !calendarData || isGuest) return;

    // Run cleanup immediately
    cleanupPastEventReminders();

    // Run cleanup once per day (24 hours)
    const intervalId = setInterval(cleanupPastEventReminders, 24 * 60 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [currentUser, calendarData, isGuest]); // Removed cleanupPastEventReminders from deps to avoid infinite loop
```

**(g)** In `addUserEvent`, replace `await db.collection('userEvents').add(eventData);` with:

```tsx
      if (isGuest) {
        updateDemoState((state) => ({
          ...state,
          userEvents: [...state.userEvents, { ...eventData, id: `demo-event-${Date.now()}` }],
        }));
      } else {
        await db.collection('userEvents').add(eventData);
      }
```

Then change its dependency array to `[currentUser, isGuest]`.

**(h)** In `updateUserEvent`, replace:

```tsx
      const eventRef = db.collection('userEvents').doc(eventId);
      const oldEventSnap = await eventRef.get();
      const oldEvent = oldEventSnap.data() as CalendarEvent;

      await eventRef.update({
        ...event,
        updatedAt: new Date().toISOString(),
      });
```

with:

```tsx
      let oldEvent: CalendarEvent;
      if (isGuest) {
        const existing = getDemoState().userEvents.find((e) => e.id === eventId);
        if (!existing) throw new Error('Event not found');
        oldEvent = existing;
        updateDemoState((state) => ({
          ...state,
          userEvents: state.userEvents.map((e) =>
            e.id === eventId ? { ...e, ...event, id: eventId } : e
          ),
        }));
      } else {
        const eventRef = db.collection('userEvents').doc(eventId);
        const oldEventSnap = await eventRef.get();
        oldEvent = oldEventSnap.data() as CalendarEvent;

        await eventRef.update({
          ...event,
          updatedAt: new Date().toISOString(),
        });
      }
```

Then add `isGuest` to its dependency array.

**(i)** Replace all of `deleteUserEvent` with:

```tsx
  // Delete user event from Firebase (or the demo store for guests)
  const deleteUserEvent = useCallback(
    async (eventId: string) => {
      if (!currentUser) throw new Error('User must be logged in');

      let eventData: CalendarEvent | undefined;
      if (isGuest) {
        eventData = getDemoState().userEvents.find((e) => e.id === eventId);
        updateDemoState((state) => ({
          ...state,
          userEvents: state.userEvents.filter((e) => e.id !== eventId),
        }));
      } else {
        const eventRef = db.collection('userEvents').doc(eventId);
        const eventSnap = await eventRef.get();
        eventData = eventSnap.exists ? (eventSnap.data() as CalendarEvent) : undefined;
        await eventRef.delete();
      }

      if (!eventData) return;

      // Remove reminder preference if it exists
      const eventKey = getEventKey(eventData);
      const hadReminder = reminderPreferences.includes(eventKey);
      if (hadReminder) {
        const newPreferences = reminderPreferences.filter((key) => key !== eventKey);
        setReminderPreferences(newPreferences);
        try {
          await saveReminderKeys(newPreferences);
        } catch (error) {
          console.error('Error removing reminder preference:', error);
        }
      }

      await logActivity(currentUser.uid, {
        type: 'event',
        title: 'Event Deleted',
        description: `Deleted event: "${eventData.description}"${hadReminder ? ' and its reminder' : ''}`,
        icon: '🗑️',
        link: '/academic-calendar',
      });
    },
    [currentUser, isGuest, reminderPreferences, getEventKey, saveReminderKeys]
  );
```

Behaviour for real users is unchanged: the event is deleted whether or not it existed, and the reminder cleanup and activity log happen only when it existed.

- [ ] **Step 4: Guest branches in `FormsContext.tsx`**

Add this import after `import { logActivity } from '@services/activityService';`:

```tsx
import { subscribeDemoState, updateDemoState } from '@features/demo/demoStore';
```

Replace `const { currentUser } = useAuth();` with `const { currentUser, isGuest } = useAuth();`.

In the load effect, insert this after the `if (!currentUser) { … return; }` block, and change its dependency array to `[currentUser, isGuest]`:

```tsx
    if (isGuest) {
      return subscribeDemoState((state) => {
        setUserFormsData(state.userForms);
        setError(null);
        setLoading(false);
      });
    }
```

In `toggleFavorite`, replace the two final lines:

```tsx
      const userDocRef = db.collection('userForms').doc(currentUser.uid);
      await userDocRef.update({ favorites: newFavorites });
```

with:

```tsx
      if (isGuest) {
        updateDemoState((state) => ({
          ...state,
          userForms: { ...state.userForms, favorites: newFavorites },
        }));
        return;
      }
      const userDocRef = db.collection('userForms').doc(currentUser.uid);
      await userDocRef.update({ favorites: newFavorites });
```

Then change its dependency array to `[currentUser, isGuest, userFormsData]`.

In `addRecentDownload`, replace the two final lines:

```tsx
      const userDocRef = db.collection('userForms').doc(currentUser.uid);
      await userDocRef.update({ recentDownloads: updatedDownloads });
```

with:

```tsx
      if (isGuest) {
        updateDemoState((state) => ({
          ...state,
          userForms: { ...state.userForms, recentDownloads: updatedDownloads },
        }));
        return;
      }
      const userDocRef = db.collection('userForms').doc(currentUser.uid);
      await userDocRef.update({ recentDownloads: updatedDownloads });
```

Then change its dependency array to `[currentUser, isGuest, userFormsData]`.

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/__tests__/demo/calendarForms.guest.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/contexts/CalendarContext.tsx src/contexts/FormsContext.tsx src/__tests__/demo/calendarForms.guest.test.tsx
git commit -m "$(printf 'Keep guest calendar events, reminders and forms local\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>')"
```

---

### Task 9: Notifications, activity feed, directory and public profiles

**Files:**
- Modify: `src/components/layout/NotificationCenter.tsx`
- Modify: `src/pages/Profile.tsx:36` and the activity effect (around `:196-234`)
- Modify: `src/pages/Directory.tsx` (imports, the hooks near `:50`, and `handleViewProfile` around `:254-282`)
- Modify: `src/pages/UserProfile.tsx` (`fetchUser`)
- Modify: `src/__tests__/pages/Directory.test.tsx` (mock `useAuth`)
- Test: `src/__tests__/demo/pages.guest.test.tsx`

**Interfaces:**
- Consumes:
  - `useAuth().isGuest` (Task 4)
  - `subscribeDemoState`, `updateDemoState`, `getDemoState`, `getDemoUserById` and `getDemoUserByAdmissionNumber` (Task 3)
- Produces: for guests, these pages read only the store, and `/u/<id>` shows "User not found" for any id outside the demo.

- [ ] **Step 1: Write the failing test**

`src/__tests__/demo/pages.guest.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const firestoreMock = vi.hoisted(() => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  updateDoc: vi.fn(),
  writeBatch: vi.fn(),
}));
const authMock = vi.hoisted(() => ({
  value: { isGuest: true, isAuthenticated: true, loading: false, currentUser: { uid: 'demo-guest' } },
}));
const userMock = vi.hoisted(() => ({ value: { user: { id: 'demo-guest' } } }));

vi.mock('firebase/firestore', () => firestoreMock);
vi.mock('@lib/firebase', () => ({ db: {}, auth: {}, storage: {} }));
vi.mock('@features/auth/hooks/useAuth', () => ({ useAuth: () => authMock.value }));
vi.mock('@contexts/UserContext', () => ({ useUser: () => userMock.value }));
vi.mock('@contexts/AppConfigContext', () => ({ useAppConfig: vi.fn() }));
vi.mock('@features/profiles/components/PublicProfile', () => ({
  PublicProfile: ({ user }: { user: { name: string } }) => <h1>{user.name}</h1>,
}));

import NotificationCenter from '@components/layout/NotificationCenter';
import { useAppConfig } from '@contexts/AppConfigContext';
import { getDemoState, resetDemoStoreForTests } from '@features/demo/demoStore';
import Directory from '@pages/Directory';
import UserProfile from '@pages/UserProfile';

const renderDirectory = () => {
  vi.mocked(useAppConfig).mockReturnValue({
    config: { directory: [], students: getDemoState().directory },
    loading: false,
  } as unknown as ReturnType<typeof useAppConfig>);

  render(
    <MemoryRouter initialEntries={['/directory']}>
      <Routes>
        <Route path="/directory" element={<Directory />} />
        <Route path="/u/:userId" element={<UserProfile />} />
      </Routes>
    </MemoryRouter>
  );
  fireEvent.click(screen.getByRole('button', { name: /^Students/ }));
};

const searchStudents = (text: string) =>
  fireEvent.change(screen.getByPlaceholderText('Search by name, admission number, or branch...'), {
    target: { value: text },
  });

describe('pages in guest mode', () => {
  beforeEach(() => {
    localStorage.clear();
    resetDemoStoreForTests();
    vi.clearAllMocks();
  });

  it('shows demo notifications and marks them read locally', () => {
    render(
      <MemoryRouter>
        <NotificationCenter />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    expect(screen.getByText('Welcome to the demo!')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Mark all read'));

    expect(getDemoState().notifications.every((n) => n.read)).toBe(true);
    expect(screen.queryByText('Mark all read')).not.toBeInTheDocument();
    expect(firestoreMock.onSnapshot).not.toHaveBeenCalled();
    expect(firestoreMock.writeBatch).not.toHaveBeenCalled();
  });

  it('opens a classmate profile from the student directory', async () => {
    renderDirectory();
    searchStudents('Ananya');
    fireEvent.click((await screen.findAllByText('ANANYA BHATTACHARJEE'))[0]!);

    expect(await screen.findByRole('heading', { name: 'Ananya Bhattacharjee' })).toBeInTheDocument();
    expect(firestoreMock.getDocs).not.toHaveBeenCalled();
    expect(firestoreMock.getDoc).not.toHaveBeenCalled();
  });

  it('says so when a classmate has no profile yet', async () => {
    renderDirectory();
    searchStudents('Aditi');
    fireEvent.click((await screen.findAllByText('ADITI HEGDE'))[0]!);

    expect(await screen.findByText('This user has not created a profile yet.')).toBeInTheDocument();
    expect(firestoreMock.getDocs).not.toHaveBeenCalled();
  });

  it("shows User not found for a real user's link", async () => {
    render(
      <MemoryRouter initialEntries={['/u/k3Jd9sQ0aPz8W1xYvB2nM4cR7tL5']}>
        <Routes>
          <Route path="/u/:userId" element={<UserProfile />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('User not found')).toBeInTheDocument();
    expect(firestoreMock.getDoc).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/__tests__/demo/pages.guest.test.tsx`
Expected: FAIL. The notifications never render because `onSnapshot` is a bare mock, and `getDocs` / `getDoc` are called.

- [ ] **Step 3: Guest branch in `NotificationCenter.tsx`**

This file uses 4-space indentation, so keep it. Add these imports after `import { useUser } from '@contexts/UserContext';`:

```tsx
import { useAuth } from '@features/auth/hooks/useAuth';
import { subscribeDemoState, updateDemoState } from '@features/demo/demoStore';
```

After `const { user } = useUser();`, add `const { isGuest } = useAuth();`.

In the `// Listen to notifications` effect, insert this after `if (!user) return;`, and change its dependency array to `[user, isGuest]`:

```tsx
        if (isGuest) {
            return subscribeDemoState((state) => {
                setNotifications(state.notifications);
                setUnreadCount(state.notifications.filter((n) => !n.read).length);
            });
        }
```

In `markAsRead`, insert this after `if (!user) return;`:

```tsx
        if (isGuest) {
            updateDemoState((state) => ({
                ...state,
                notifications: state.notifications.map((n) =>
                    n.id === notificationId ? { ...n, read: true } : n
                ),
            }));
            return;
        }
```

In `markAllAsRead`, insert this after `if (!user || unreadCount === 0) return;`:

```tsx
        if (isGuest) {
            updateDemoState((state) => ({
                ...state,
                notifications: state.notifications.map((n) => ({ ...n, read: true })),
            }));
            return;
        }
```

- [ ] **Step 4: Guest branch in `Profile.tsx`'s activity feed**

Add this import after `import { db } from '@lib/firebase';`:

```tsx
import { subscribeDemoState } from '@features/demo/demoStore';
```

Replace `const { currentUser } = useAuth();` (line 36) with `const { currentUser, isGuest } = useAuth();`.

In the activity effect, insert this after the `if (!currentUser) { setActivityLoading(false); return; }` block, and change its dependency array to `[currentUser, isGuest]`:

```tsx
    if (isGuest) {
      return subscribeDemoState((state) => {
        setActivity(state.activity);
        setActivityLoading(false);
      });
    }
```

- [ ] **Step 5: Guest branch in `Directory.tsx`**

Add these imports after `import { db } from '@/lib/firebase';`:

```tsx
import { useAuth } from '@features/auth/hooks/useAuth';
import { getDemoUserByAdmissionNumber } from '@features/demo/demoStore';
```

Directly after `const { config, loading: configLoading } = useAppConfig();`, add `const { isGuest } = useAuth();`.

In `handleViewProfile`, replace the body of the `try { … }` block:

```tsx
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('admissionNumber', '==', admissionNumber));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userId = querySnapshot.docs[0]!.id;
        navigate(`/u/${userId}`);
      } else {
```

with:

```tsx
      let userId: string | undefined;
      if (isGuest) {
        userId = getDemoUserByAdmissionNumber(admissionNumber)?.id;
      } else {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('admissionNumber', '==', admissionNumber));
        const querySnapshot = await getDocs(q);
        userId = querySnapshot.docs[0]?.id;
      }

      if (userId) {
        navigate(`/u/${userId}`);
      } else {
```

The `else` branch (the "not created a profile yet" notification), the `catch` and the `finally` stay as they are.

- [ ] **Step 6: Guest branch in `UserProfile.tsx`**

Add this import after `import { db } from '@/lib/firebase';`:

```tsx
import { getDemoUserById } from '@features/demo/demoStore';
```

Replace `const { currentUser } = useAuth();` with `const { currentUser, isGuest } = useAuth();`.

In `fetchUser`, insert this directly after `if (!userId) return;`:

```tsx
    if (isGuest) {
      // Guests only see the demo's own people; any other uid is simply not found
      const demoUser = getDemoUserById(userId);
      if (demoUser) {
        setUser(demoUser);
      } else {
        setError('User not found');
      }
      setLoading(false);
      return;
    }
```

- [ ] **Step 7: Mock `useAuth` in the existing Directory test**

In `src/__tests__/pages/Directory.test.tsx`, directly after the `vi.mock('../../lib/firebase', …)` block, add:

```tsx
// Directory checks for guest mode; these tests cover signed-in students
vi.mock('@features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ isGuest: false }),
}));
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `npx vitest run src/__tests__/demo/pages.guest.test.tsx src/__tests__/pages/Directory.test.tsx`
Expected: PASS (4 new tests, plus the existing Directory tests).

- [ ] **Step 9: Commit**

```bash
git add src/components/layout/NotificationCenter.tsx src/pages/Profile.tsx src/pages/Directory.tsx src/pages/UserProfile.tsx src/__tests__/pages/Directory.test.tsx src/__tests__/demo/pages.guest.test.tsx
git commit -m "$(printf 'Show guests demo notifications, activity and classmate profiles\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>')"
```

---

### Task 10: Location gate, session timeouts and the demo banner

**Files:**
- Modify: `src/components/common/LocationRequirement.tsx`
- Modify: `src/components/common/SessionGuard.tsx`
- Create: `src/features/demo/DemoBanner.tsx`
- Modify: `src/pages/Layout.tsx`
- Test: `src/__tests__/demo/shell.guest.test.tsx`

**Interfaces:**
- Consumes:
  - `useAuth()`: `isGuest`, `isAuthenticated`, `logout` (Task 4)
  - `resetDemoState` (Task 3)
  - `useLocation()` from `@contexts/LocationContext`
  - `useSessionManager` and `SessionWarningModal` from `@hooks/useSessionManager`
- Produces:
  - `LocationRequirement` gates only signed-in, non-guest users.
  - `SessionGuard` skips timeouts for guests.
  - `export const DemoBanner: React.FC` renders only for guests.

- [ ] **Step 1: Write the failing test**

`src/__tests__/demo/shell.guest.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authMock = vi.hoisted(() => ({ value: {} as Record<string, unknown> }));
const sessionMock = vi.hoisted(() => ({
  useSessionManager: vi.fn(() => ({
    showWarning: true,
    remainingSeconds: 30,
    extendSession: vi.fn(),
    logout: vi.fn(),
  })),
}));

vi.mock('@features/auth/hooks/useAuth', () => ({ useAuth: () => authMock.value }));
vi.mock('@contexts/LocationContext', () => ({
  useLocation: () => ({
    permissionStatus: 'denied',
    error: 'User denied the request for Geolocation.',
    loading: false,
    location: null,
    retryLocation: vi.fn(),
  }),
}));
vi.mock('@hooks/useSessionManager', () => ({
  useSessionManager: sessionMock.useSessionManager,
  SessionWarningModal: () => <div>Session expiring</div>,
}));

import { LocationRequirement } from '@components/common/LocationRequirement';
import SessionGuard from '@components/common/SessionGuard';
import { DemoBanner } from '@features/demo/DemoBanner';
import { getDemoState, resetDemoStoreForTests, updateDemoProfile } from '@features/demo/demoStore';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('LocationRequirement', () => {
  const renderGate = () =>
    render(
      <LocationRequirement>
        <p>App content</p>
      </LocationRequirement>
    );

  it('lets guests in without a location', () => {
    authMock.value = { isGuest: true, isAuthenticated: true };
    renderGate();
    expect(screen.getByText('App content')).toBeInTheDocument();
  });

  it('lets signed-out visitors reach the login page', () => {
    authMock.value = { isGuest: false, isAuthenticated: false };
    renderGate();
    expect(screen.getByText('App content')).toBeInTheDocument();
  });

  it('still requires location from signed-in students', () => {
    authMock.value = { isGuest: false, isAuthenticated: true };
    renderGate();
    expect(screen.getByText('Location Access Required')).toBeInTheDocument();
    expect(screen.queryByText('App content')).not.toBeInTheDocument();
  });
});

describe('SessionGuard', () => {
  beforeEach(() => {
    sessionMock.useSessionManager.mockClear();
  });

  it('skips session timeouts for guests', () => {
    authMock.value = { isGuest: true };
    render(
      <SessionGuard>
        <p>App content</p>
      </SessionGuard>
    );
    expect(screen.getByText('App content')).toBeInTheDocument();
    expect(screen.queryByText('Session expiring')).not.toBeInTheDocument();
    expect(sessionMock.useSessionManager).not.toHaveBeenCalled();
  });

  it('keeps session timeouts for students', () => {
    authMock.value = { isGuest: false };
    render(
      <SessionGuard>
        <p>App content</p>
      </SessionGuard>
    );
    expect(screen.getByText('Session expiring')).toBeInTheDocument();
  });
});

describe('DemoBanner', () => {
  beforeEach(() => {
    localStorage.clear();
    resetDemoStoreForTests();
  });

  const renderBanner = () =>
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<DemoBanner />} />
          <Route path="/login" element={<p>Login page</p>} />
        </Routes>
      </MemoryRouter>
    );

  it('renders nothing for students', () => {
    authMock.value = { isGuest: false };
    const { container } = renderBanner();
    expect(container).toBeEmptyDOMElement();
  });

  it('resets the demo after confirmation', () => {
    authMock.value = { isGuest: true, logout: vi.fn() };
    updateDemoProfile({ bio: 'Changed' });
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderBanner();
    expect(screen.getByText("You're exploring College Central with sample data.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reset demo' }));

    expect(getDemoState().profile.bio).not.toBe('Changed');
  });

  it('keeps changes when the reset is cancelled', () => {
    authMock.value = { isGuest: true, logout: vi.fn() };
    updateDemoProfile({ bio: 'Changed' });
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderBanner();
    fireEvent.click(screen.getByRole('button', { name: 'Reset demo' }));

    expect(getDemoState().profile.bio).toBe('Changed');
  });

  it('exits to the login page', async () => {
    const logout = vi.fn(async () => {});
    authMock.value = { isGuest: true, logout };

    renderBanner();
    fireEvent.click(screen.getByRole('button', { name: 'Exit demo' }));

    expect(await screen.findByText('Login page')).toBeInTheDocument();
    expect(logout).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/__tests__/demo/shell.guest.test.tsx`
Expected: FAIL with `Failed to resolve import "@features/demo/DemoBanner"`.

- [ ] **Step 3: Gate only signed-in students in `LocationRequirement.tsx`**

Add this import after `import { useLocation } from '@contexts/LocationContext';`:

```tsx
import { useAuth } from '@features/auth/hooks/useAuth';
```

Replace the start of the component, up to and including the `if (location) { … }` block:

```tsx
export const LocationRequirement: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { permissionStatus, error, loading, location, retryLocation } = useLocation();

  // If we have a location, we're good.
  if (location) {
    return <>{children}</>;
  }
```

with:

```tsx
export const LocationRequirement: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isGuest } = useAuth();
  const { permissionStatus, error, loading, location, retryLocation } = useLocation();

  // Location is required of signed-in students only: visitors must be able to reach
  // the login page, and guests exploring the demo are never tracked
  if (!isAuthenticated || isGuest) {
    return <>{children}</>;
  }

  // If we have a location, we're good.
  if (location) {
    return <>{children}</>;
  }
```

- [ ] **Step 4: Exempt guests from timeouts in `SessionGuard.tsx`**

Replace the file's contents with:

```tsx
/**
 * Session Guard Component
 *
 * Wraps protected content to enforce session management.
 * Displays warning modal when session is about to expire.
 */

import { useAuth } from '@features/auth/hooks/useAuth';
import { useSessionManager, SessionWarningModal } from '@hooks/useSessionManager';
import React from 'react';

interface SessionGuardProps {
  children: React.ReactNode;
}

const ManagedSession: React.FC<SessionGuardProps> = ({ children }) => {
  const { showWarning, remainingSeconds, extendSession, logout } = useSessionManager();

  return (
    <>
      {children}
      {showWarning && (
        <SessionWarningModal
          remainingSeconds={remainingSeconds}
          onExtend={extendSession}
          onLogout={logout}
        />
      )}
    </>
  );
};

export const SessionGuard: React.FC<SessionGuardProps> = ({ children }) => {
  const { isGuest } = useAuth();

  // Guests hold no account, so the idle and max-session limits don't apply
  if (isGuest) {
    return <>{children}</>;
  }

  return <ManagedSession>{children}</ManagedSession>;
};

export default SessionGuard;
```

- [ ] **Step 5: Create `DemoBanner.tsx`**

`src/features/demo/DemoBanner.tsx`:

```tsx
import { useAuth } from '@features/auth/hooks/useAuth';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { resetDemoState } from './demoStore';

/** Always visible while a guest explores, so it's clear the data is sample data. */
export const DemoBanner: React.FC = () => {
  const { isGuest, logout } = useAuth();
  const navigate = useNavigate();

  if (!isGuest) return null;

  const handleReset = () => {
    if (window.confirm('Reset the demo? Your changes will be replaced with the original sample data.')) {
      resetDemoState();
      toast.success('Demo data reset');
    }
  };

  const handleExit = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 py-2 text-sm bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100 border-b border-amber-200 dark:border-amber-800"
    >
      <span>You're exploring College Central with sample data.</span>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleReset}
          className="font-semibold underline underline-offset-2 hover:no-underline"
        >
          Reset demo
        </button>
        <button
          type="button"
          onClick={handleExit}
          className="font-semibold underline underline-offset-2 hover:no-underline"
        >
          Exit demo
        </button>
      </div>
    </div>
  );
};
```

- [ ] **Step 6: Render the banner in `Layout.tsx`**

Add this import after `import SessionGuard from '@components/common/SessionGuard';`:

```tsx
import { DemoBanner } from '@features/demo/DemoBanner';
```

Replace:

```tsx
            <main className="flex-1">
              <div className="px-3 sm:px-6 lg:px-8 py-6 sm:py-8 w-full max-w-9xl mx-auto">
```

with:

```tsx
            <main className="flex-1">
              <DemoBanner />
              <div className="px-3 sm:px-6 lg:px-8 py-6 sm:py-8 w-full max-w-9xl mx-auto">
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npx vitest run src/__tests__/demo/shell.guest.test.tsx`
Expected: PASS (9 tests).

- [ ] **Step 8: Commit**

```bash
git add src/components/common/LocationRequirement.tsx src/components/common/SessionGuard.tsx src/features/demo/DemoBanner.tsx src/pages/Layout.tsx src/__tests__/demo/shell.guest.test.tsx
git commit -m "$(printf 'Let guests skip the location gate and session timeouts, and show the demo banner\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>')"
```

---

### Task 11: End-to-end guest flow and final verification

**Files:**
- Create: `e2e/guest.spec.ts`

**Interfaces:**
- Consumes: everything above, through the real app on `http://localhost:3000`. Playwright's `webServer` starts it with `npm run dev`.
- Produces: proof that the whole flow works in a browser and that a guest session makes no Firestore or Storage requests.

- [ ] **Step 1: Write the end-to-end spec**

`e2e/guest.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

/**
 * Guest demo mode: visitors without a college email explore the app with sample data.
 */
test.describe('Guest demo mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/login');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByRole('button', { name: 'Explore as guest' }).click();
    await expect(page.getByText("You're exploring College Central with sample data.")).toBeVisible();
  });

  test('shows the demo student’s profile', async ({ page }) => {
    await page.goto('/#/profile');
    await expect(page.getByText('Aarav Mehta').first()).toBeVisible();
  });

  test('keeps changes across reloads until the demo is reset', async ({ page, isMobile }) => {
    test.skip(isMobile, 'On phones the bell sits inside the quick-actions menu');
    const bell = page.getByRole('button', { name: 'Notifications' }).first();
    const markAllRead = page.getByRole('button', { name: 'Mark all read' });

    await bell.click();
    await markAllRead.click();
    await page.reload();
    await bell.click();
    await expect(markAllRead).toHaveCount(0);

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Reset demo' }).click();
    await bell.click();
    await expect(markAllRead).toBeVisible();
  });

  test('lists only fictional students in the directory', async ({ page }) => {
    await page.goto('/#/directory');
    await page.getByRole('button', { name: /^Students/ }).click();
    await expect(page.getByRole('button', { name: /^Students\s*31$/ })).toBeVisible();
    await expect(page.getByText('AADI BISWAS')).toHaveCount(0); // first name in the real directory
  });

  test('cannot open the admin panel', async ({ page }) => {
    await page.goto('/#/admin');
    await expect(page).not.toHaveURL(/#\/admin/);
  });

  test('exit returns to the login page', async ({ page }) => {
    await page.getByRole('button', { name: 'Exit demo' }).click();
    await expect(page).toHaveURL(/#\/login/);
    await expect(page.getByRole('button', { name: 'Explore as guest' })).toBeVisible();
  });

  test('never talks to Firestore or Storage', async ({ page, context }) => {
    // The login page itself reads the public app config from Firestore. Close that tab and
    // open a fresh one, which boots straight into the demo (the flag is in localStorage)
    await page.close();
    const tab = await context.newPage();
    const firebaseRequests: string[] = [];
    tab.on('request', (request) => {
      if (/firestore\.googleapis\.com|firebasestorage\.googleapis\.com/.test(request.url())) {
        firebaseRequests.push(request.url());
      }
    });

    for (const path of [
      '/#/',
      '/#/grades',
      '/#/schedule',
      '/#/academic-calendar',
      '/#/college-forms',
      '/#/campus-map',
      '/#/directory',
      '/#/profile',
    ]) {
      await tab.goto(path);
      await tab.waitForLoadState('networkidle');
    }

    await expect(tab.getByText("You're exploring College Central with sample data.")).toBeVisible();
    expect(firebaseRequests).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the end-to-end spec**

Run: `npx playwright test e2e/guest.spec.ts`
Expected: PASS. That is 6 tests on `chromium`, plus 6 on `Mobile Chrome`, where the notification test is skipped.

If `npx playwright install chromium` hasn't been run on this machine, run it first.

- [ ] **Step 3: Run the whole unit suite**

Run: `npx vitest run`
Expected: every test passes. That is the original 150 plus the 57 new ones in `src/__tests__/demo/`.

- [ ] **Step 4: Confirm there are no new type or lint errors**

```bash
BASE="${TMPDIR:-/tmp}/guest-demo"
npx tsc --noEmit 2>&1 | grep "error TS" | sed -E 's/\([0-9]+,[0-9]+\)//' | sort > "$BASE/tsc-after.txt"
npx eslint src --ext .ts,.tsx --quiet -f unix | grep "\[Error" | sed -E 's/:[0-9]+:[0-9]+:/:/' | sort > "$BASE/eslint-after.txt"
echo "new tsc errors:"; comm -13 "$BASE/tsc-baseline.txt" "$BASE/tsc-after.txt"
echo "new eslint errors:"; comm -13 "$BASE/eslint-baseline.txt" "$BASE/eslint-after.txt"
```

Expected: nothing listed under either heading. If something is listed, fix it in the file named and re-run this step.

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: exit code 0. This runs `vite build` and then `scripts/check-bundle-secrets.js`, which must report no secrets.

- [ ] **Step 6: Check the pages a quick manual look covers best**

Run `npm run dev`, open `http://localhost:3000/#/login`, and click **Explore as guest**. Confirm each of these:

- [ ] **Dashboard:** the banner is visible and nothing asks for location.
- [ ] **Grades:** 4 semesters, CGPA **8.76**.
- [ ] **Schedule:** the NCSC507–512 and NCSC595 classes, plus the Saturday "Hackathon team sync" task.
- [ ] **Academic Calendar:** "Advanced DBMS lab viva" in 2 days, with its reminder on.
- [ ] **Profile:** the activity feed starts with "Started exploring the demo."
- [ ] **Campus Map:** Central Library, CSE Department and NLHC are saved, and the crowd levels vary.
- [ ] **College Forms:** two favourites are starred.
- [ ] **Profile → change photo:** shows "Profile pictures can't be changed in the demo."
- [ ] **Exit demo, then Explore as guest again:** your earlier changes are still there. **Reset demo** clears them.

- [ ] **Step 7: Commit**

```bash
git add e2e/guest.spec.ts
git commit -m "$(printf 'Cover the guest demo end to end\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>')"
```
