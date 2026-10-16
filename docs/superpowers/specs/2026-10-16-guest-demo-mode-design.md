# Guest Demo Mode — Design

**Date:** 2026-10-16
**Status:** Approved in conversation; awaiting written-spec review
**Branch:** `feat/guest-demo-mode` (from `main`)

## Goal

Let people without a college email address (recruiters, reviewers, students elsewhere, curious visitors) try College Central with realistic sample data. Their changes are throwaway. They must never see real student data, and adding guest access must not weaken sign-in for real students.

## Non-goals

- Persistent guest accounts, or upgrading a guest into a real account.
- Guests sharing data with each other (no shared demo backend).
- Admin panel access for guests (possible follow-up).
- Any change to `firestore.rules` or `storage.rules`.

## Approach

Client-side demo mode. A guest gets **no Firebase identity**. Every place that reads or writes per-user Firestore/Storage data gets an explicit guest branch that uses a local, localStorage-backed demo store instead.

Two alternatives were rejected:

- **Anonymous Auth in the live project.** Guests could write to production, every `users` rule would need a guest variant, and it needs a rules deploy.
- **A separate demo Firebase project.** It means a new project, hosting site and pipeline, and it depends on GCP account standing.

We also considered swapping the exported `db` for an in-memory fake, which would have needed no call-site changes. It doesn't work because the codebase mixes the compat API (`db.collection(...)`) with the modular API (`collection(db, ...)`, `getDoc(doc(db, ...))`). Modular functions check the instance type, so they reject a fake.

### Safety property

Guests have no auth token, so a guest branch that gets missed **fails closed**: Firestore and Storage rules deny the call and no data leaks. A guest makes no Firebase requests at all. Even the app config comes from the bundled defaults (see `AppConfigContext` below), not from Firestore.

## Components

All new code lives in `src/features/demo/`.

### `demoSession.ts`

- `DEMO_UID = 'demo-guest'`. Real Firebase uids are 28-character random strings, so they can't collide with it.
- `isDemoActive(): boolean`: reads the flag `cc_demo_session` from localStorage. If localStorage throws, it uses an in-memory flag instead.
- `startDemo()` / `endDemo()`: set and clear the flag.
- Services that only receive a `uid` call `isDemoActive()`. React code uses `useAuth().isGuest`.

### `demoStore.ts`

A typed store with one root object kept in localStorage under `cc_demo_store`:

```ts
interface DemoState {
  version: number;                 // bump when the seed shape changes; mismatch ⇒ reseed
  seededAt: number;                // epoch ms; dates in the seed are relative to this
  profile: User;                   // includes gradesData, scheduleData, savedCampusPlaces, gradeScenarios
  userForms: UserFormsData;
  userEvents: CalendarEvent[];     // guest-created calendar events (userId = DEMO_UID)
  reminderEventKeys: string[];
  notifications: Notification[];
  activity: ActivityItem[];        // newest first, capped at 30 (mirrors cleanupOldActivities)
  classmates: User[];              // the 6 classmates with full public profiles (/u/:id)
  directory: StudentDirectoryEntry[]; // guest + ~30 fictional classmates, shown in the Directory
}
```

- **API:**
  - `getDemoState()`
  - `updateDemoState(fn: (s) => DemoState)`
  - `subscribeDemoState(listener): () => void`
  - `resetDemoState()`
  - plus small helpers such as `addDemoActivity(item)`
- Writes notify subscribers synchronously, which mirrors `onSnapshot`.
- If stored JSON is corrupt or its version doesn't match, the store reseeds. If localStorage is unavailable, the state lives in memory for the tab's lifetime.
- **Timestamps:** stored as plain `{ seconds, nanoseconds }`. Every consumer (activity feed, notification list) reads only `.seconds`, so no conversion to a Firestore `Timestamp` is needed.

### `demoData.ts`

`createDemoSeed(now: Date): DemoState`. It is pure and deterministic for a given `now`, which makes it testable.

- **Guest profile:** "Aarav Mehta", a fictional B.Tech CSE student who is always in 3rd year (semester 5), with a bio, interests and social links.
  - The batch is derived from `now`: academic-year start (July) minus 2. In October 2026 that gives admission number `24JE9001`, so `courseOption` is NEP via `getCourseOptionFromAdmissionNumber`.
  - The 9xxx range is outside real batch numbering, and a test enforces that.
- **Grades:** 4 completed semesters, with session names and years derived from `now`.
  - The bundled course data is a flat list of the current timetable, with no branch or semester mapping, so past-semester subjects come from a curated list in `demoData.ts` (realistic CSE course names, codes and LTP).
  - Credits come from `calculateCreditsFromLTP`, and SGPA/CGPA are computed with the app's own grade-point calculation, so every number is internally consistent.
- **Timetable:** about 6 courses picked from the bundled `NEP_TIMETABLE_DATA`, using a preferred code list and falling back to the first N entries. They are turned into `ClassSchedule` entries with the same conversion the Schedule page uses, plus one custom task.
- **Saved places:** 3, by id, taken from the bundled campus map.
- **Forms:** 2 favourite forms and 2 recent downloads, taken from the bundled forms config.
- **Calendar:** 4 personal events, dated relative to `now` (for example +2, +5 and +12 days, and one past event).
- **Notifications:** 6 entries (welcome, timetable change, fee reminder, club event, and so on), 2 of them unread.
- **Activity:** about 10 entries spread over the past 2 weeks.
- **Classmates:** about 30 fictional students with the same batch prefix (`24JE9002`, …) across several branches. 6 of them have full public profiles.

### `DemoBanner.tsx`

- A slim bar that renders inside `Layout` whenever `isGuest` is true. It is never hidden, so guests always know the data is sample data.
- Text: "You're exploring College Central with sample data." Actions: **Reset demo** (confirm, then `resetDemoState()`) and **Exit demo** (`logout()`).

## Changes to existing code

| File | Guest behaviour |
|---|---|
| `features/auth/hooks/useAuth.tsx` | Adds `isGuest` and `enterGuestMode()`. When the demo is active and there is no Firebase user, `currentUser` is a frozen stand-in `{ uid: DEMO_UID, email: 'guest@demo.local', displayName, photoURL: null }` cast to `firebase.User`, and `isAuthenticated` is true. `logout()` for a guest calls `endDemo()` and makes no Firebase call. A real Firebase user appearing in `onAuthStateChanged` calls `endDemo()`, so the two states are mutually exclusive. |
| `pages/Login.tsx` | Adds a secondary "Explore as guest" button under the Google button, which calls `enterGuestMode()` and navigates to `/`. |
| `contexts/UserContext.tsx` | Guest: subscribes to `demoStore.profile`. `updateUser` patches the store. `uploadProfilePicture` throws a "not available in demo" error, which the existing UI already shows. Skips `initializeUser` and `cleanupOldActivities`. |
| `contexts/GradesContext.tsx` | Guest: reads and writes `profile.gradesData`. `processGrades` (Storage upload plus Gemini) is blocked with a demo message. Manual grade editing works. |
| `contexts/ScheduleContext.tsx` | Guest: reads and writes `profile.scheduleData`. |
| `contexts/CalendarContext.tsx` | Guest: `userEvents` and reminder preferences come from the store, and add/update/delete/toggle mutate the store. |
| `contexts/FormsContext.tsx` | Guest: `userForms` comes from the store. |
| `contexts/CampusMapContext.tsx` | Guest: `savedCampusPlaces` comes from the store. Live crowd levels use the existing mock data from `locationAnalyticsService`, not Firestore. |
| `contexts/AppConfigContext.tsx` | Guest: uses the bundled `generateDefaultConfig()` instead of subscribing to Firestore, with `students` replaced by the demo `directory`. Courses, campus map, calendar, forms, quick links and the faculty/office directory stay real, because the institute publishes them. Using the bundled config keeps the demo timetable consistent with the course list, and it means guests make no Firebase calls at all. |
| `features/auth/hooks/useRole.tsx` | Guest: `role = 'user'` without reading Firestore, so `/admin` is unreachable. |
| `services/activityService.ts` | `logActivity` / `cleanupOldActivities`: if `isDemoActive()`, they write to or trim the store's `activity` and return. |
| `pages/Profile.tsx` | Guest: the activity feed subscribes to the store. |
| `components/layout/NotificationCenter.tsx` | Guest: notifications come from the store, and mark-read / mark-all-read mutate the store. |
| `pages/Directory.tsx` | Guest: `handleViewProfile` looks up classmates by `admissionNumber` in the store. |
| `pages/UserProfile.tsx` | Guest: `/u/:id` resolves to the guest's own profile or a classmate from the store, and otherwise shows "User not found". |
| `services/locationAnalyticsService.ts` | Functions that take a uid return early for `DEMO_UID` (`getUserLocationState`, `updateUserLocationState`, `recordLocationVisit`, `updateUserLocation`, `getUserStats`), so `LocationContext`, `NativeLocationProvider` and the CampusMap page need no changes. `getRealTimeCrowdLevels` and `getZonePopularTimes` return sample data while the demo is active. Weather is unaffected because it uses a city the user picks, not geolocation. |
| `components/common/LocationRequirement.tsx` | Applies **only to signed-in, non-guest users**. Unauthenticated visitors reach `/login` without granting location, and guests are never gated. (Behaviour change: real students now see the location requirement after signing in rather than before.) |
| `pages/Layout.tsx` / `components/common/SessionGuard.tsx` | Guests are exempt from the idle and max-session logouts, since there is nothing sensitive to protect. `DemoBanner` renders here. |

## Data flow (guest)

1. `/login` → "Explore as guest" → `enterGuestMode()` → `startDemo()` → the store is seeded on first `getDemoState()` → `AuthProvider` exposes the stand-in user → navigate to `/`.
2. Providers see `isGuest` and subscribe to store slices instead of Firestore.
3. A mutation runs `updateDemoState()`, which persists to localStorage and notifies subscribers, and the UI updates as it would after an `onSnapshot` tick.
4. Reload → `isDemoActive()` is still true → same state.
5. Exit → `endDemo()` → `/login`. The store keeps its data, so a returning guest resumes. "Reset demo" is the explicit wipe.

## Error handling

- **Corrupt or old stored state:** reseed, with no error shown to the user.
- **Guest denies location:** nothing breaks. Weather uses the selected city, and the map simply shows no "you are here" marker.
- **localStorage unavailable** (private mode, blocked storage): the store and flag are in-memory and the demo works for that tab.
- **Features that need the backend** (profile-picture upload, grade-sheet scanning): show the existing error or toast UI with "Not available in the demo."
- **A missed guest branch:** the rules deny the Firestore call. This shows up as an empty widget plus a console error, never as leaked data. The tests below are designed to catch these cases.

## Testing

**Vitest:**

- `demoData`: the seed is deterministic for a fixed `now`. CGPA and credits agree with the app's own calculation. Event dates are relative to `now`. Classmates' admission numbers don't overlap with `STUDENT_DIRECTORY`.
- `demoStore`: lazy seeding, persistence round-trip, subscriber notification, reset, version-mismatch reseed, and the in-memory fallback when `localStorage` throws.
- `demoSession`: flag set and clear, and the fallback.
- Guest-mode provider tests (User, Grades, Schedule, Calendar, Forms, CampusMap) with `@lib/firebase` mocked, asserting that store data renders **and that no `db` / `storage` method is called**.
- `useAuth`: a real Firebase user clears demo mode.

**Playwright (`e2e/guest.spec.ts`):**

- From `/login`, click "Explore as guest" → the dashboard shows "Aarav Mehta" → add a timetable entry → reload → the entry is still there → Reset demo → the entry is gone.
- The guest Directory contains no names from the real student directory.
- `/admin` redirects away for a guest.

**Validation:** `main` currently has type and lint errors that PR #42 fixes. This branch must not add new ones: compare `npm run type-check` / `npm run lint` counts against `main`, and run `npm run build` and `npm run test:run`.

## Open follow-ups (not in scope)

- Admin panel demo (sandboxed config edits and synthetic analytics).
- These pre-existing security issues were found during exploration and are worth a separate fix:
  - `appConfig/*` is world-readable, including `adminEmails` and the full `students` directory.
  - `active_locations` has no rule, so every write is denied.
  - `email_verified` is never checked in the rules.
  - The client decides admins from `appConfig/adminEmails`, but the rules decide them from `users.role`.
