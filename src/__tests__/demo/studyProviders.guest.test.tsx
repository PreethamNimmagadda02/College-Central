import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

import { AppConfigProvider } from '@contexts/AppConfigContext';
import { CampusMapProvider, useCampusMap } from '@contexts/CampusMapContext';
import { GradesProvider, useGrades } from '@contexts/GradesContext';
import { ScheduleProvider, useSchedule } from '@contexts/ScheduleContext';
import { UserProvider } from '@contexts/UserContext';
import { endDemo, startDemo } from '@features/demo/demoSession';
import { getDemoState, resetDemoStoreForTests } from '@features/demo/demoStore';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppConfigProvider>
    <UserProvider>
      <GradesProvider>
        <ScheduleProvider>
          <CampusMapProvider>{children}</CampusMapProvider>
        </ScheduleProvider>
      </GradesProvider>
    </UserProvider>
  </AppConfigProvider>
);

describe('study providers in guest mode', () => {
  beforeEach(() => {
    localStorage.clear();
    resetDemoStoreForTests();
    startDemo();
    vi.clearAllMocks();
  });

  afterEach(() => {
    endDemo();
  });

  it('reads and writes the timetable locally', async () => {
    const { result } = renderHook(() => useSchedule(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.scheduleData).toEqual(getDemoState().profile.scheduleData);

    const trimmed = result.current.scheduleData!.slice(1);
    await act(() => result.current.setScheduleData(trimmed));

    expect(getDemoState().profile.scheduleData).toEqual(trimmed);
    expect(result.current.scheduleData).toEqual(trimmed);
    expect(firebaseMock.db.collection).not.toHaveBeenCalled();
  });

  it('reads and clears grades locally but refuses grade-sheet scanning', async () => {
    const { result } = renderHook(() => useGrades(), { wrapper });
    await waitFor(() => expect(result.current.gradesData?.semesters).toHaveLength(4));

    let processed: boolean | undefined;
    await act(async () => {
      processed = await result.current.processGrades();
    });
    // false: nothing was processed, so the page shows no success celebration
    expect(processed).toBe(false);
    expect(result.current.error).toBe(
      "Grade-sheet scanning isn't available in the demo. You can still edit your grades by hand."
    );
    expect(result.current.isProcessing).toBe(false);

    await act(() => result.current.resetGradesState());
    expect(result.current.gradesData).toBeNull();
    expect(getDemoState().activity[0]!.title).toBe('Grades Data Cleared');
    expect(firebaseMock.db.collection).not.toHaveBeenCalled();
    expect(firebaseMock.storage.refFromURL).not.toHaveBeenCalled();
  });

  it('saves campus places locally and shows sample crowd levels', async () => {
    const { result } = renderHook(() => useCampusMap(), { wrapper });
    await waitFor(() =>
      expect(result.current.savedPlaces).toEqual(getDemoState().profile.savedCampusPlaces)
    );

    await act(() => result.current.toggleSavePlace('loc-1'));

    expect(getDemoState().profile.savedCampusPlaces).toContain('loc-1');
    await waitFor(() => expect(result.current.liveZoneStatus.length).toBeGreaterThan(0));
    expect(firebaseMock.db.collection).not.toHaveBeenCalled();
  });
});
