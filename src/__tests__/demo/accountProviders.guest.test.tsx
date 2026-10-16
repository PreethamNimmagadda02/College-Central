import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';

const firebaseMock = vi.hoisted(() => ({
  db: { collection: vi.fn(), runTransaction: vi.fn(), batch: vi.fn() },
  auth: { onAuthStateChanged: vi.fn(() => () => {}), currentUser: null, signOut: vi.fn() },
  storage: { ref: vi.fn(), refFromURL: vi.fn() },
}));
const configServiceMock = vi.hoisted(() => ({
  subscribeToConfig: vi.fn(() => () => {}),
  initializeConfig: vi.fn(() => Promise.resolve()),
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
vi.mock('@services/configService', () => configServiceMock);
vi.mock('@features/auth/hooks/useAuth', () => ({ useAuth: () => authMock.value }));

import { generateDefaultConfig } from '@config/defaultConfig';
import { STUDENT_DIRECTORY } from '@config/studentDirectory';
import { AppConfigProvider, useAppConfig } from '@contexts/AppConfigContext';
import { UserProvider, useUser } from '@contexts/UserContext';
import { RoleProvider, useRole } from '@features/auth/hooks/useRole';
import { getDemoState, resetDemoStoreForTests } from '@features/demo/demoStore';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppConfigProvider>
    <UserProvider>
      <RoleProvider>{children}</RoleProvider>
    </UserProvider>
  </AppConfigProvider>
);

const renderAccount = () =>
  renderHook(() => ({ user: useUser(), config: useAppConfig(), role: useRole() }), { wrapper });

describe('account providers in guest mode', () => {
  beforeEach(() => {
    localStorage.clear();
    resetDemoStoreForTests();
    vi.clearAllMocks();
  });

  it('loads the demo profile and saves edits locally', async () => {
    const { result } = renderAccount();
    await waitFor(() => expect(result.current.user.user?.name).toBe('Aarav Mehta'));

    await act(() => result.current.user.updateUser({ bio: 'Edited in the demo' }));

    expect(result.current.user.user?.bio).toBe('Edited in the demo');
    expect(getDemoState().activity[0]!.title).toBe('Profile Updated');
    expect(firebaseMock.db.collection).not.toHaveBeenCalled();
    expect(firebaseMock.db.runTransaction).not.toHaveBeenCalled();
    expect(firebaseMock.auth.onAuthStateChanged).not.toHaveBeenCalled();
  });

  it('refuses profile picture uploads without touching Storage', async () => {
    const { result } = renderAccount();
    await waitFor(() => expect(result.current.user.user).not.toBeNull());

    const photo = new File(['x'], 'me.png', { type: 'image/png' });
    await expect(result.current.user.uploadProfilePicture(photo)).rejects.toThrow(
      "Profile pictures can't be changed in the demo."
    );
    expect(firebaseMock.storage.ref).not.toHaveBeenCalled();
  });

  it('serves bundled config with fictional classmates instead of real students', async () => {
    const { result } = renderAccount();
    await waitFor(() => expect(result.current.config.loading).toBe(false));

    const { students, courses } = result.current.config.config;
    expect(students).toEqual(getDemoState().directory);
    expect(students.some((s) => s.admNo === STUDENT_DIRECTORY[0]!.admNo)).toBe(false);
    expect(courses).toHaveLength(generateDefaultConfig().courses.length);
    expect(configServiceMock.subscribeToConfig).not.toHaveBeenCalled();
    expect(configServiceMock.initializeConfig).not.toHaveBeenCalled();
  });

  it('never grants a guest the admin role', async () => {
    const { result } = renderAccount();
    await waitFor(() => expect(result.current.role.isLoading).toBe(false));

    expect(result.current.role.isAdmin).toBe(false);
    expect(firebaseMock.db.collection).not.toHaveBeenCalled();
  });
});
