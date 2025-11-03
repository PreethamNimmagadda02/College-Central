import React, { Suspense, useEffect } from 'react';
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
import UpdatePrompt from './components/UpdatePrompt';
import { measurePageLoad } from './utils/performance';
import { lazyWithRetry } from './utils/lazyWithRetry';

// Lazy load pages with automatic retry on chunk loading failure
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'));
const Grades = lazyWithRetry(() => import('./pages/Grades'));
const Schedule = lazyWithRetry(() => import('./pages/Schedule'));
const Directory = lazyWithRetry(() => import('./pages/Directory'));
const Profile = lazyWithRetry(() => import('./pages/Profile'));
const NotFound = lazyWithRetry(() => import('./pages/NotFound'));
const CampusMap = lazyWithRetry(() => import('./pages/CampusMap'));
const CollegeForms = lazyWithRetry(() => import('./pages/CollegeForms'));
const AcademicCalendar = lazyWithRetry(() => import('./pages/AcademicCalendar'));
const Login = lazyWithRetry(() => import('./pages/Login'));
const PrivacyPolicy = lazyWithRetry(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazyWithRetry(() => import('./pages/TermsOfService'));

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
        path: 'privacy',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PrivacyPolicy />
          </Suspense>
        )
      },
      {
        path: 'terms',
        element: (
          <Suspense fallback={<PageLoader />}>
            <TermsOfService />
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
  useEffect(() => {
    // Measure initial app load performance
    measurePageLoad('app_initial_load');
  }, []);

  return (
    <>
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
      <UpdatePrompt />
    </>
  );
};

export default App;