import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getCountdownEvents, getEventKey, getUpcomingEvents } from '@lib/utils/eventUtils';

import { CalendarEvent } from '@/types';

const event = (date: string, description: string, endDate?: string): CalendarEvent => ({
  date,
  description,
  type: 'Other',
  ...(endDate ? { endDate } : {}),
});

describe('eventUtils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 16, 12)); // Oct 16, 2026
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keys an event by its date and description', () => {
    expect(getEventKey(event('2026-10-20', 'Viva'))).toBe('2026-10-20-Viva');
  });

  it('lists ongoing events and those starting within a week, soonest first', () => {
    const events = [
      event('2026-11-30', 'Too far'),
      event('2026-10-19', 'Next week'),
      event('2026-10-01', 'Over'),
      event('2026-10-10', 'Ongoing', '2026-10-20'),
    ];

    expect(getUpcomingEvents(events).map((e) => e.description)).toEqual(['Ongoing', 'Next week']);
  });

  it('counts down to at most three reminded events that are still ahead', () => {
    const events = [
      event('2026-12-01', 'Fourth'),
      event('2026-10-01', 'Past'),
      event('2026-10-25', 'Second'),
      event('2026-10-20', 'First'),
      event('2026-11-01', 'Third'),
      event('2026-10-22', 'Not reminded'),
    ];
    const keys = ['Fourth', 'Past', 'Second', 'First', 'Third', 'Missing'].map((d) =>
      getEventKey(events.find((e) => e.description === d) ?? event('2026-10-21', d))
    );

    expect(getCountdownEvents(events, keys).map((e) => e.description)).toEqual([
      'First',
      'Second',
      'Third',
    ]);
  });
});
