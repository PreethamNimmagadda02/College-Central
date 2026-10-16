// Auth feature hooks

// Context providers
import { Capacitor } from '@capacitor/core';
import ErrorBoundary from '@components/common/ErrorBoundary';
import { InstallPrompt } from '@components/common/InstallPrompt';
import { LocationRequirement } from '@components/common/LocationRequirement';
import { NativeLocationTracker } from '@components/common/NativeLocationTracker';
import { OfflineIndicator } from '@components/common/OfflineIndicator';
import ProtectedRoute from '@components/common/ProtectedRoute';

// Layout and common components
import UpdatePrompt from '@components/common/UpdatePrompt';
import { CampusMapProvider } from '@contexts/CampusMapContext';
import { LocationProvider } from '@contexts/LocationContext';
import { WeatherProvider } from '@contexts/WeatherContext';
import WeatherModal from '@components/weather/WeatherModal';
import { AppConfigProvider } from '@contexts/AppConfigContext';
import { CalendarProvider } from '@contexts/CalendarContext';
import { FormsProvider } from '@contexts/FormsContext';
import { GradesProvider } from '@contexts/GradesContext';
import { ScheduleProvider } from '@contexts/ScheduleContext';
import { UserProvider } from '@contexts/UserContext';
import { AuthProvider } from '@features/auth/hooks/useAuth';
import { RoleProvider } from '@features/auth/hooks/useRole';
import { GuestBoundary } from '@features/demo/GuestBoundary';
import Layout from '@pages/Layout';

// Utilities
import React, { lazy, Suspense, useEffect } from 'react';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';

// Lazy load pages (main.tsx reloads once if a chunk from an old deploy is gone)
const Dashboard = lazy(() => import('@pages/Dashboard'));
const Grades = lazy(() => import('@pages/Grades'));
const Schedule = lazy(() => import('@pages/Schedule'));
const Directory = lazy(() => import('@pages/Directory'));
const Profile = lazy(() => import('@pages/Profile'));
const NotFound = lazy(() => import('@pages/NotFound'));
const CampusMap = lazy(() => import('@pages/CampusMap'));
const CollegeForms = lazy(() => import('@pages/CollegeForms'));
const AcademicCalendar = lazy(() => import('@pages/AcademicCalendar'));
const Login = lazy(() => import('@pages/Login'));
const PrivacyPolicy = lazy(() => import('@pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('@pages/TermsOfService'));
const OfflinePage = lazy(() => import('@pages/OfflinePage'));
const UserProfile = lazy(() => import('@pages/UserProfile'));

// Admin Dashboard - available for admin users in all environments
const AdminDashboard = lazy(() => import('@features/admin/AdminDashboard'));
// Auth redirect page for role-based routing
const AuthRedirect = lazy(() => import('@pages/AuthRedirect'));

// Loading fallback component
const PageLoader = React.memo(() => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-t-transparent border-primary rounded-full animate-spin mx-auto"></div>
      <p className="mt-4 text-slate-500 dark:text-slate-400">Loading...</p>
    </div>
  </div>
));
PageLoader.displayName = 'PageLoader';

const router = createHashRouter([
  // Admin Dashboard routes (protected - requires admin role)
  {
    path: '/admin',
    element: (
      <ProtectedRoute requireAdmin>
        <Suspense fallback={<PageLoader />}>
          <AdminDashboard />
        </Suspense>
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: null }, // Default to college-info
      { path: 'college-info', element: null },
      { path: 'branches', element: null },
      { path: 'hostels', element: null },
      { path: 'quick-links', element: null },
      { path: 'quotes', element: null },
      { path: 'forms', element: null },
      { path: 'calendar', element: null },
      { path: 'directory', element: null },
      { path: 'courses', element: null },
      { path: 'students', element: null },
      { path: 'campus-map', element: null },
      { path: 'grading', element: null },
      { path: 'analytics', element: null },
      { path: 'grade-analytics', element: null },
      { path: 'location-analytics', element: null },
      { path: 'broadcasts', element: null },
      { path: 'support', element: null },
    ],
  },
  {
    path: '/login',
    element: (
      <Suspense fallback={<PageLoader />}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: '/auth-redirect',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <AuthRedirect />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/offline',
    element: (
      <Suspense fallback={<PageLoader />}>
        <OfflinePage />
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
        ),
      },
      {
        path: 'grades',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Grades />
          </Suspense>
        ),
      },
      {
        path: 'schedule',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Schedule />
          </Suspense>
        ),
      },
      {
        path: 'directory',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Directory />
          </Suspense>
        ),
      },
      {
        path: 'campus-map',
        element: (
          <Suspense fallback={<PageLoader />}>
            <CampusMap />
          </Suspense>
        ),
      },
      {
        path: 'college-forms',
        element: (
          <Suspense fallback={<PageLoader />}>
            <CollegeForms />
          </Suspense>
        ),
      },
      {
        path: 'academic-calendar',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AcademicCalendar />
          </Suspense>
        ),
      },

      {
        path: 'profile',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Profile />
          </Suspense>
        ),
      },
      {
        path: 'u/:userId',
        element: (
          <Suspense fallback={<PageLoader />}>
            <UserProfile />
          </Suspense>
        ),
      },
      {
        path: 'privacy',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PrivacyPolicy />
          </Suspense>
        ),
      },
      {
        path: 'terms',
        element: (
          <Suspense fallback={<PageLoader />}>
            <TermsOfService />
          </Suspense>
        ),
      },

      {
        path: '*',
        element: (
          <Suspense fallback={<PageLoader />}>
            <NotFound />
          </Suspense>
        ),
      },
    ],
  },
]);

const App: React.FC = () => {
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    // Fade out splash screen
    const splash = document.getElementById('app-splash');
    if (splash) {
      splash.style.opacity = '0';
      setTimeout(() => {
        splash.style.display = 'none';
      }, 500); // Match CSS transition duration
    }
  }, []);

  return (
    <>
      <AuthProvider>
        <GuestBoundary>
          <AppConfigProvider>
            <UserProvider>
              <RoleProvider>
                <GradesProvider>
                  <ScheduleProvider>
                    <CalendarProvider>
                      <FormsProvider>
                        <WeatherProvider>
                          <CampusMapProvider>
                            <LocationProvider>
                              <LocationRequirement>
                                {isNative && <NativeLocationTracker />}
                                <RouterProvider router={router} />
                                <WeatherModal />
                              </LocationRequirement>
                            </LocationProvider>
                          </CampusMapProvider>
                        </WeatherProvider>
                      </FormsProvider>
                    </CalendarProvider>
                  </ScheduleProvider>
                </GradesProvider>
              </RoleProvider>
            </UserProvider>
          </AppConfigProvider>
        </GuestBoundary>
      </AuthProvider>
      <UpdatePrompt />
      <InstallPrompt />
      <OfflineIndicator />
      <Toaster />
    </>
  );
};

export default App;
