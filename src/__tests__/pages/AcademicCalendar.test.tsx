import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CalendarEvent } from '@/types';

const calendarMock = vi.hoisted(() => ({
  addUserEvent: vi.fn(() => Promise.resolve()),
  updateUserEvent: vi.fn(() => Promise.resolve()),
  deleteUserEvent: vi.fn(() => Promise.resolve()),
  toggleReminderPreference: vi.fn(() => Promise.resolve()),
  events: [] as CalendarEvent[],
}));

vi.mock('@contexts/CalendarContext', async () => {
  const { getEventKey } = await import('@lib/utils/eventUtils');
  return {
    useCalendar: () => ({
      calendarData: {
        semesterStartDate: '2026-07-20',
        semesterEndDate: '2026-12-05',
        events: calendarMock.events,
      },
      loading: false,
      reminderPreferences: [],
      getEventKey,
      addUserEvent: calendarMock.addUserEvent,
      updateUserEvent: calendarMock.updateUserEvent,
      deleteUserEvent: calendarMock.deleteUserEvent,
      toggleReminderPreference: calendarMock.toggleReminderPreference,
    }),
  };
});

import AcademicCalendar from '@pages/AcademicCalendar';

const labelledInput = (label: string) =>
  screen.getByText(label).parentElement!.querySelector('input, select') as HTMLInputElement;

describe('AcademicCalendar page', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 16, 12)); // Oct 16, 2026
    vi.clearAllMocks();
    calendarMock.events = [
      { date: '2026-10-18', description: 'Hackathon', type: 'Other' },
      { date: '2026-10-28', description: 'Lab viva', type: 'Other', id: 'e1', userId: 'u1' },
    ];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('marks events by how soon they are', () => {
    render(<AcademicCalendar />);
    expect(screen.getAllByText('URGENT').length).toBeGreaterThan(0); // Hackathon, in 2 days
    expect(screen.getByText('📅 12d')).toBeInTheDocument(); // Lab viva
  });

  it('adds an event with a reminder', async () => {
    render(<AcademicCalendar />);
    fireEvent.click(screen.getAllByRole('button', { name: /Add Event/ })[0]!);
    expect(screen.getByRole('heading', { name: 'Add New Event' })).toBeInTheDocument();

    fireEvent.change(labelledInput('Event Description *'), { target: { value: 'Mock test' } });
    fireEvent.change(labelledInput('Start Date *'), { target: { value: '2026-11-02' } });
    fireEvent.click(screen.getByLabelText('🔔 Remind me about this event'));
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Add Event' })));

    expect(calendarMock.addUserEvent).toHaveBeenCalledWith({
      date: '2026-11-02',
      endDate: '',
      description: 'Mock test',
      type: 'Other',
      remindMe: true,
    });
    expect(calendarMock.toggleReminderPreference).toHaveBeenCalledWith('2026-11-02-Mock test');
  });

  it('edits one of the user’s own events', async () => {
    render(<AcademicCalendar />);
    fireEvent.click(screen.getAllByText('Lab viva')[0]!);
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByRole('heading', { name: 'Edit Event' })).toBeInTheDocument();
    expect(screen.queryByLabelText('🔔 Remind me about this event')).not.toBeInTheDocument();

    fireEvent.change(labelledInput('Event Description'), { target: { value: 'Lab exam' } });
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Save Changes' })));

    expect(calendarMock.updateUserEvent).toHaveBeenCalledWith('e1', {
      ...calendarMock.events[1],
      description: 'Lab exam',
    });
  });
});
