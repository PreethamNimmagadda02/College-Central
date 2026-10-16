import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const firebaseMock = vi.hoisted(() => ({
  db: { collection: vi.fn(), runTransaction: vi.fn(), batch: vi.fn() },
  auth: { onAuthStateChanged: vi.fn(() => () => {}), currentUser: null, signOut: vi.fn() },
  storage: { ref: vi.fn(), refFromURL: vi.fn() },
}));
const authMock = vi.hoisted(() => ({
  value: {
    isGuest: true,
    isAuthenticated: true,
    loading: false,
    currentUser: { uid: 'demo-guest', email: 'guest@demo.local' },
  },
}));

vi.mock('@lib/firebase', () => firebaseMock);
vi.mock('@services/configService', () => ({
  subscribeToConfig: vi.fn(() => () => {}),
  initializeConfig: vi.fn(() => Promise.resolve()),
}));
vi.mock('@features/auth/hooks/useAuth', () => ({ useAuth: () => authMock.value }));

import { allForms } from '@config/forms';
import { AppConfigProvider } from '@contexts/AppConfigContext';
import { CalendarProvider, useCalendar } from '@contexts/CalendarContext';
import { FormsProvider, useForms } from '@contexts/FormsContext';
import { DEMO_UID } from '@features/demo/demoSession';
import { getDemoState, resetDemoStoreForTests } from '@features/demo/demoStore';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppConfigProvider>
    <CalendarProvider>
      <FormsProvider>{children}</FormsProvider>
    </CalendarProvider>
  </AppConfigProvider>
);

const inDays = (days: number) => {
  const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

describe('calendar and forms in guest mode', () => {
  beforeEach(() => {
    localStorage.clear();
    resetDemoStoreForTests();
    vi.clearAllMocks();
  });

  it('keeps the seeded reminders on first load', async () => {
    const { result } = renderHook(() => useCalendar(), { wrapper });
    await waitFor(() => expect(result.current.calendarData).not.toBeNull());
    expect(result.current.reminderPreferences).toEqual(getDemoState().reminderEventKeys);
    expect(getDemoState().reminderEventKeys).toHaveLength(2);
  });

  it('shows guests the academic calendar shifted to the current year', async () => {
    const { result } = renderHook(() => useCalendar(), { wrapper });
    await waitFor(() => expect(result.current.calendarData).not.toBeNull());

    const start = new Date(result.current.calendarData!.semesterStartDate);
    expect(start.getFullYear()).toBe(new Date().getFullYear());
  });

  it('adds, updates and deletes personal events in the demo store', async () => {
    const date = inDays(10);
    const key = `${date}-Mock interview`;
    const { result } = renderHook(() => useCalendar(), { wrapper });
    await waitFor(() => expect(result.current.calendarData).not.toBeNull());

    await act(() =>
      result.current.addUserEvent({ date, description: 'Mock interview', type: 'Other' })
    );
    const added = getDemoState().userEvents.find((e) => e.description === 'Mock interview')!;
    expect(added.userId).toBe(DEMO_UID);
    await waitFor(() =>
      expect(
        result.current.calendarData?.events.some((e) => e.description === 'Mock interview')
      ).toBe(true)
    );

    await act(() => result.current.updateUserEvent(added.id!, { ...added, remindMe: true }));
    expect(getDemoState().reminderEventKeys).toContain(key);

    await act(() => result.current.deleteUserEvent(added.id!));
    expect(getDemoState().userEvents.some((e) => e.id === added.id)).toBe(false);
    expect(getDemoState().reminderEventKeys).not.toContain(key);
    expect(firebaseMock.db.collection).not.toHaveBeenCalled();
  });

  it('keeps favourite forms and downloads in the demo store', async () => {
    const { result } = renderHook(() => useForms(), { wrapper });
    await waitFor(() => expect(result.current.userFormsData).toEqual(getDemoState().userForms));

    const form = allForms.find((f) => !getDemoState().userForms.favorites.includes(f.formNumber))!;
    await act(() => result.current.toggleFavorite(form.formNumber));
    expect(getDemoState().userForms.favorites).toContain(form.formNumber);

    await act(() => result.current.addRecentDownload(form));
    expect(getDemoState().userForms.recentDownloads[0]!.formNumber).toBe(form.formNumber);
    expect(firebaseMock.db.collection).not.toHaveBeenCalled();
  });
});
