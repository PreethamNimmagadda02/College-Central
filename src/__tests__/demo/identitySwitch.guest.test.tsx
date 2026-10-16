import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const firebaseMock = vi.hoisted(() => {
  const authListeners: ((user: unknown) => void)[] = [];
  const reminderWrites = vi.fn((_data: unknown) => Promise.resolve());
  const docRef = {
    set: reminderWrites,
    get: vi.fn(() => new Promise(() => {})), // the real account's reminders are still loading
    update: vi.fn(() => Promise.resolve()),
    onSnapshot: vi.fn(() => () => {}),
  };
  return {
    authListeners,
    reminderWrites,
    auth: {
      onAuthStateChanged: vi.fn((listener: (user: unknown) => void) => {
        authListeners.push(listener);
        return () => {};
      }),
      signOut: vi.fn(),
      currentUser: null,
    },
    db: {
      collection: vi.fn(() => ({
        doc: vi.fn(() => docRef),
        where: vi.fn(() => ({ onSnapshot: vi.fn(() => () => {}) })),
      })),
    },
    storage: {},
  };
});

vi.mock('@lib/firebase', () => ({
  auth: firebaseMock.auth,
  db: firebaseMock.db,
  storage: firebaseMock.storage,
}));
vi.mock('@services/configService', () => ({
  subscribeToConfig: vi.fn(() => () => {}),
  initializeConfig: vi.fn(() => Promise.resolve()),
}));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));
vi.mock('@codetrix-studio/capacitor-google-auth', () => ({ GoogleAuth: { initialize: vi.fn() } }));

import { AppConfigProvider } from '@contexts/AppConfigContext';
import { CalendarProvider, useCalendar } from '@contexts/CalendarContext';
import { AuthProvider } from '@features/auth/hooks/useAuth';
import { GuestBoundary } from '@features/demo/GuestBoundary';
import { DEMO_UID, endDemo, startDemo } from '@features/demo/demoSession';
import { resetDemoStoreForTests, updateDemoState } from '@features/demo/demoStore';

let calendar: ReturnType<typeof useCalendar> | undefined;
const CalendarProbe = () => {
  calendar = useCalendar();
  return null;
};

describe('switching from a guest session to a real account', () => {
  beforeEach(() => {
    localStorage.clear();
    resetDemoStoreForTests();
    endDemo();
    firebaseMock.authListeners.length = 0;
    calendar = undefined;
    vi.clearAllMocks();
  });

  it("never writes the guest's reminders into the real account", async () => {
    // A returning guest whose demo holds a reminder for an event that has since passed
    startDemo();
    updateDemoState((s) => ({
      ...s,
      userEvents: [
        ...s.userEvents,
        { id: 'past', date: '2020-01-01', description: 'Old viva', type: 'Other', remindMe: true, userId: DEMO_UID },
      ],
      reminderEventKeys: [...s.reminderEventKeys, '2020-01-01-Old viva'],
    }));

    render(
      <AuthProvider>
        <GuestBoundary>
          <AppConfigProvider>
            <CalendarProvider>
              <CalendarProbe />
            </CalendarProvider>
          </AppConfigProvider>
        </GuestBoundary>
      </AuthProvider>
    );
    await waitFor(() => expect(calendar?.reminderPreferences).toContain('2020-01-01-Old viva'));

    // The student signs in (for example in another tab, synced into this one)
    act(() => {
      firebaseMock.authListeners.forEach((listener) =>
        listener({ uid: 'real-student-uid', email: '24je0001@iitism.ac.in' })
      );
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(firebaseMock.reminderWrites).not.toHaveBeenCalled();
    expect(calendar?.reminderPreferences).toEqual([]);
  });
});
