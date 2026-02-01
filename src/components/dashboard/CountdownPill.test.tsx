import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CountdownPill from './CountdownPill';
import { BrowserRouter } from 'react-router-dom';
import { CalendarEvent } from '@/types';
import React from 'react';

// Mock getEventEmoji
vi.mock('@lib/utils/eventUtils', () => ({
  getEventEmoji: () => '📅'
}));

describe('CountdownPill', () => {
  const events: CalendarEvent[] = [
    {
      id: '1',
      date: new Date(Date.now() + 10000000).toISOString(), // Future date
      description: 'Future Event',
      type: 'Other'
    }
  ];

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders correctly', () => {
    render(
      <BrowserRouter>
        <CountdownPill events={events} />
      </BrowserRouter>
    );
    expect(screen.getByText('Future Event')).toBeInTheDocument();
  });

  it('updates countdown on tick', () => {
    render(
      <BrowserRouter>
        <CountdownPill events={events} />
      </BrowserRouter>
    );

    // We expect it to render initially
    expect(screen.getByText('Future Event')).toBeInTheDocument();

    // Move time forward
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // It should still be there (no crash)
    expect(screen.getByText('Future Event')).toBeInTheDocument();
  });
});
