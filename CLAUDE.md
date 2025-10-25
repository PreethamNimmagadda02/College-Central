# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

College Central is a comprehensive web application for IIT(ISM) Dhanbad students to manage academic life, campus navigation, events, and resources. Built with React 19 + TypeScript + Vite, using Firebase for backend services and Google Gemini AI for intelligent features.

## Development Commands

### Running the Application
```bash
npm run dev          # Start development server on http://localhost:3000
npm run build        # Production build
npm run preview      # Preview production build
```

### Firebase Deployment
```bash
npm run build                    # Build first
firebase deploy                  # Deploy to Firebase Hosting
firebase deploy --only hosting   # Deploy hosting only
firebase deploy --only firestore # Deploy Firestore rules/indexes only
```

## Project Architecture

### Flat File Structure
The project uses a **flat file structure** - all source files are located directly in the project root, not in a `src/` directory:
- `App.tsx` - Main application component with router configuration
- `index.tsx` - Application entry point
- `types.ts` - All TypeScript type definitions
- `firebaseConfig.ts` - Firebase initialization using compat API
- `pages/` - Page components (Dashboard, Grades, Schedule, etc.)
- `components/` - Reusable UI components
- `contexts/` - React Context providers for global state
- `hooks/` - Custom React hooks
- `services/` - API services (activityService, api)
- `data/` - Static data and constants
- `utils/` - Utility functions

### State Management Architecture

The application uses **React Context API with multiple specialized providers** for state management. Each provider manages its own domain:

1. **AuthProvider** (`hooks/useAuth.tsx`) - Firebase authentication state
2. **UserProvider** (`contexts/UserContext.tsx`) - User profile data with Firestore sync
3. **GradesProvider** (`contexts/GradesContext.tsx`) - Academic grades and CGPA calculations
4. **ScheduleProvider** (`contexts/ScheduleContext.tsx`) - Class schedules and timetables
5. **CalendarProvider** (`contexts/CalendarContext.tsx`) - Academic calendar events and reminders
6. **CampusMapProvider** (`contexts/CampusMapContext.tsx`) - Campus locations and navigation
7. **FormsProvider** (`contexts/FormsContext.tsx`) - College forms management

**Important**: All providers are nested in `App.tsx` in a specific order. AuthProvider is the outermost, wrapping all other providers.

### Firebase Architecture

**Firebase Compat API**: The project uses Firebase v9 compat library for backward compatibility:
- Authentication: `firebase.auth()`
- Firestore: `firebase.firestore()`
- Storage: `firebase.storage()`

**Key Firebase Services**:
- **Authentication**: Google OAuth and email/password
- **Firestore Collections**:
  - `users/{userId}` - User profiles
  - `users/{userId}/grades` - Student grades (subcollection)
  - `users/{userId}/schedule` - Class schedules (subcollection)
  - `users/{userId}/activities` - Activity logs (subcollection)
  - `users/{userId}/calendar` - Calendar events (subcollection)
  - `users/{userId}/forms` - Forms data (subcollection)
- **Storage**: User profile pictures at `profilePictures/{userId}/{filename}`

### Router Configuration

The application uses **HashRouter** from react-router-dom v7:
- Routes configured in `App.tsx` using `createHashRouter`
- All pages are lazy-loaded with `React.lazy()` and `Suspense`
- Protected routes wrapped in `<ProtectedRoute>` component
- Main layout (`pages/Layout.tsx`) wraps all authenticated routes

### Context Providers Pattern

Each context provider follows a consistent pattern:
1. Real-time Firestore synchronization via snapshots
2. Optimistic updates for better UX
3. Error handling and loading states
4. Activity logging for user actions
5. Memoized context values to prevent unnecessary re-renders

**Example**: `UserProvider` subscribes to `users/{userId}` document and automatically syncs profile changes in real-time.

## Environment Variables

Required in `.env` file (NOT committed to git per `.gitignore`):
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
VITE_GEMINI_API_KEY
```

## Key Type Definitions (types.ts)

- **User**: Profile with optional fields (profilePicture, semester, courseOption)
- **Grade**: Subject grade with credits, attendance, and LTP format
- **Semester**: Academic semester with SGPA and grades array
- **ClassSchedule**: Timetable entry with optional `isCustomTask` flag
- **CalendarEvent**: Events with optional reminders and user associations
- **CampusLocation**: Map locations with coordinates and category
- **ActivityItem**: Activity log entries with Firestore timestamp shape

## Important Architectural Notes

1. **No centralized src/ directory**: All source files are in project root
2. **Firebase Compat API**: Use `db.collection()`, `auth()` syntax, not modular SDK
3. **Path alias**: `@/*` resolves to project root (configured in vite.config.ts and tsconfig.json)
4. **Firestore subcollections**: User-specific data stored as subcollections under `users/{userId}`
5. **Activity logging**: Most user actions logged via `logActivity()` from `services/activityService.ts`
6. **Lazy loading**: All pages lazy-loaded to improve initial bundle size
7. **Real-time sync**: Most contexts use Firestore `onSnapshot()` for live updates
8. **Google Gemini AI**: Used for weather recommendations and AI-powered features

## Common Patterns

### Adding a new context provider:
1. Create file in `contexts/` directory
2. Implement with Firestore real-time listener
3. Add to provider chain in `App.tsx` (order matters!)
4. Export custom hook (e.g., `useGrades()`, `useSchedule()`)

### Adding a new page:
1. Create in `pages/` directory
2. Add lazy import in `App.tsx`
3. Add route configuration to router
4. Wrap in `<Suspense>` with fallback

### Firestore operations:
```typescript
// Use compat API syntax
const docRef = db.collection('users').doc(userId);
docRef.set(data);
docRef.update(data);
docRef.onSnapshot(callback);
```

## Firebase Deployment

The app deploys to Firebase Hosting with:
- Firestore rules defined in `firestore.rules`
- Firestore indexes defined in `firestore.indexes.json`
- Hosting config in `firebase.json` (serves from `dist/`, SPA rewrites enabled)

Always build before deploying: `npm run build && firebase deploy`
