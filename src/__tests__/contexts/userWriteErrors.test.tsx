import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

const firebaseMock = vi.hoisted(() => {
  const userDoc = {
    onSnapshot: vi.fn((_options: unknown, next: (snap: unknown) => void) => {
      next({
        exists: true,
        id: 'u1',
        data: () => ({ name: 'Real Student', savedCampusPlaces: [] }),
      });
      return () => {};
    }),
    update: vi.fn(() => Promise.reject(new Error('Missing or insufficient permissions.'))),
  };
  return {
    auth: {
      onAuthStateChanged: vi.fn((listener: (user: unknown) => void) => {
        listener({ uid: 'u1', email: 'u1@iitism.ac.in' });
        return () => {};
      }),
      currentUser: { uid: 'u1' },
    },
    db: {
      collection: vi.fn(() => ({ doc: vi.fn(() => userDoc) })),
      runTransaction: vi.fn(() => Promise.resolve(false)),
    },
    storage: {},
  };
});

vi.mock('@lib/firebase', () => firebaseMock);
vi.mock('@services/activityService', () => ({
  logActivity: vi.fn(),
  cleanupOldActivities: vi.fn(() => Promise.resolve()),
}));
vi.mock('@services/configService', () => ({
  subscribeToConfig: vi.fn(() => () => {}),
  initializeConfig: vi.fn(() => Promise.resolve()),
}));
vi.mock('@services/locationAnalyticsService', () => ({
  getRealTimeCrowdLevels: vi.fn(() => Promise.resolve([])),
}));
// A stable object: effects keyed on currentUser would re-run every render otherwise
const authMock = vi.hoisted(() => ({
  value: { isGuest: false, isAuthenticated: true, loading: false, currentUser: { uid: 'u1' } },
}));
vi.mock('@features/auth/hooks/useAuth', () => ({ useAuth: () => authMock.value }));

import { AppConfigProvider } from '@contexts/AppConfigContext';
import { CampusMapProvider, useCampusMap } from '@contexts/CampusMapContext';
import { UserProvider, useUser } from '@contexts/UserContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppConfigProvider>
    <UserProvider>
      <CampusMapProvider>{children}</CampusMapProvider>
    </UserProvider>
  </AppConfigProvider>
);

describe('a failed profile save', () => {
  it('is reported to the caller without breaking pages that read the profile', async () => {
    const { result } = renderHook(() => ({ user: useUser(), map: useCampusMap() }), { wrapper });
    await waitFor(() => expect(result.current.user.user?.name).toBe('Real Student'));

    let failure: unknown;
    await act(async () => {
      try {
        await result.current.user.updateUser({ bio: 'New bio' });
      } catch (e) {
        failure = e;
      }
    });

    expect((failure as Error).message).toBe('Missing or insufficient permissions.');
    expect(result.current.user.error).toBeNull();
    expect(result.current.map.error).toBeNull();
  });
});
