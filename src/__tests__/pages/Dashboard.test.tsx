import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Hook results must be stable objects, or the Dashboard's effects re-run on every render
const mocks = vi.hoisted(() => ({
  config: { config: { quickLinks: [], quotes: [] } },
  user: { user: { id: 'u', name: 'Aarav Mehta', quickLinks: [] }, loading: false },
  grades: { gradesData: { cgpa: 8.5 }, loading: false },
  schedule: {
    scheduleData: [
      {
        day: 'Monday',
        startTime: '09:00',
        endTime: '10:00',
        courseCode: 'CS101',
        courseName: 'Algorithms',
      },
      {
        day: 'Monday',
        startTime: '14:00',
        endTime: '15:00',
        courseCode: 'GYM',
        courseName: 'Gym',
        isCustomTask: true,
      },
      {
        day: 'Tuesday',
        startTime: '09:00',
        endTime: '10:00',
        courseCode: 'MA201',
        courseName: 'Calculus',
      },
    ],
    loading: false,
  },
  calendar: {
    calendarData: {
      semesterStartDate: '2026-07-20',
      semesterEndDate: '2026-12-05',
      events: [
        { date: '2026-10-19', description: 'Diwali', type: 'Holiday' },
        { date: '2026-10-20', description: 'Working as per Monday timetable', type: 'Other' },
      ],
    },
    loading: false,
    reminderPreferences: [],
  },
}));

vi.mock('@contexts/AppConfigContext', () => ({ useAppConfig: () => mocks.config }));
vi.mock('@contexts/UserContext', () => ({ useUser: () => mocks.user }));
vi.mock('@contexts/GradesContext', () => ({ useGrades: () => mocks.grades }));
vi.mock('@contexts/ScheduleContext', () => ({ useSchedule: () => mocks.schedule }));
vi.mock('@contexts/CalendarContext', () => ({ useCalendar: () => mocks.calendar }));

import Dashboard from '@pages/Dashboard';

const jumpTo = (value: string) =>
  fireEvent.change(screen.getByLabelText('Jump to date'), { target: { value } });

describe('Dashboard schedule', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 16, 10)); // Fri Oct 16, 2026
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('jumps to a date picked in the date input and keeps it when the input is cleared', () => {
    jumpTo('2026-10-19');
    expect(screen.getByText("It's a Holiday! 🎉")).toBeInTheDocument();
    expect(screen.getByText('Gym')).toBeInTheDocument();
    expect(screen.queryByText('Algorithms')).not.toBeInTheDocument();

    jumpTo('');
    expect(screen.getByLabelText('Jump to date')).toHaveValue('2026-10-19');
  });

  it('follows another weekday’s timetable when the calendar says so', () => {
    jumpTo('2026-10-20');
    expect(
      screen.getByText("📅 This day follows Monday's schedule as per the academic calendar.")
    ).toBeInTheDocument();
    expect(screen.getByText('Algorithms')).toBeInTheDocument();
    expect(screen.queryByText('Calculus')).not.toBeInTheDocument();
  });
});
