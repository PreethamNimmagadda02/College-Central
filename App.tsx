import React from 'react';
import { createHashRouter, RouterProvider } from 'react-router-dom';

import { AuthProvider } from './hooks/useAuth';
import { UserProvider } from './contexts/UserContext';
import { GradesProvider } from './contexts/GradesContext';
import { ScheduleProvider } from './contexts/ScheduleContext';
import { CalendarProvider } from './contexts/CalendarContext';
import { CampusMapProvider } from './contexts/CampusMapContext';
import { FormsProvider } from './contexts/FormsContext';

import Layout from './pages/Layout';
import Dashboard from './pages/Dashboard';
import Grades from './pages/Grades';
import Schedule from './pages/Schedule';
import Directory from './pages/Directory';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import ErrorBoundary from './components/ErrorBoundary';
import CampusMap from './pages/CampusMap';
import CollegeForms from './pages/CollegeForms';
import AcademicCalendar from './pages/AcademicCalendar';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

const router = createHashRouter([
  {
    path: '/login',
    element: <Login />,
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
      { index: true, element: <Dashboard /> },
      { path: 'grades', element: <Grades /> },
      { path: 'schedule', element: <Schedule /> },
      { path: 'directory', element: <Directory /> },
      { path: 'campus-map', element: <CampusMap /> },
      { path: 'college-forms', element: <CollegeForms /> },
      { path: 'academic-calendar', element: <AcademicCalendar /> },
      { path: 'profile', element: <Profile /> },
      { path: '*', element: <NotFound /> },
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