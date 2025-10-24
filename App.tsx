import React, { lazy, Suspense } from 'react';
import { createHashRouter, RouterProvider } from 'react-router-dom';

import { AuthProvider } from './hooks/useAuth';
import { UserProvider } from './contexts/UserContext';
import { GradesProvider } from './contexts/GradesContext';
import { ScheduleProvider } from './contexts/ScheduleContext';
import { CalendarProvider } from './contexts/CalendarContext';
import { CampusMapProvider } from './contexts/CampusMapContext';
import { FormsProvider } from './contexts/FormsContext';

import Layout from './pages/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load pages for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Grades = lazy(() => import('./pages/Grades'));
const Schedule = lazy(() => import('./pages/Schedule'));
const Directory = lazy(() => import('./pages/Directory'));
const Profile = lazy(() => import('./pages/Profile'));
const NotFound = lazy(() => import('./pages/NotFound'));
const CampusMap = lazy(() => import('./pages/CampusMap'));
const CollegeForms = lazy(() => import('./pages/CollegeForms'));
const AcademicCalendar = lazy(() => import('./pages/AcademicCalendar'));
const Login = lazy(() => import('./pages/Login'));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-t-transparent border-primary rounded-full animate-spin mx-auto"></div>
      <p className="mt-4 text-slate-500 dark:text-slate-400">Loading...</p>
    </div>
  </div>
);

const router = createHashRouter([
  {
    path: '/login',
    element: (
      <Suspense fallback={<PageLoader />}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <Dashboard />
          </Suspense>
        )
      },
      {
        path: 'grades',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Grades />
          </Suspense>
        )
      },
      {
        path: 'schedule',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Schedule />
          </Suspense>
        )
      },
      {
        path: 'directory',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Directory />
          </Suspense>
        )
      },
      {
        path: 'campus-map',
        element: (
          <Suspense fallback={<PageLoader />}>
            <CampusMap />
          </Suspense>
        )
      },
      {
        path: 'college-forms',
        element: (
          <Suspense fallback={<PageLoader />}>
            <CollegeForms />
          </Suspense>
        )
      },
      {
        path: 'academic-calendar',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AcademicCalendar />
          </Suspense>
        )
      },
      {
        path: 'profile',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Profile />
          </Suspense>
        )
      },
      {
        path: '*',
        element: (
          <Suspense fallback={<PageLoader />}>
            <NotFound />
          </Suspense>
        )
      },
    ],
  },
]);

const App: React.FC = () => {
  return (
    <AuthProvider>
      <UserProvider>
        <GradesProvider> 
          <ScheduleProvider>
            <CalendarProvider> 
              <FormsProvider>
                <CampusMapProvider>
                  <RouterProvider router={router} />
                </CampusMapProvider>
              </FormsProvider>
            </CalendarProvider>
          </ScheduleProvider>
        </GradesProvider>
      </UserProvider>
    </AuthProvider>
  );
};

export default App;