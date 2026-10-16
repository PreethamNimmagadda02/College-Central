import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const firebaseMock = vi.hoisted(() => {
  const listener: { emit: ((user: unknown) => void) | null } = { emit: null };
  return {
    listener,
    auth: {
      onAuthStateChanged: vi.fn((callback: (user: unknown) => void) => {
        listener.emit = callback;
        return () => {};
      }),
      signOut: vi.fn(),
      currentUser: null,
    },
    db: { collection: vi.fn() },
    storage: {},
  };
});

vi.mock('@lib/firebase', () => ({
  auth: firebaseMock.auth,
  db: firebaseMock.db,
  storage: firebaseMock.storage,
}));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));
vi.mock('@codetrix-studio/capacitor-google-auth', () => ({
  GoogleAuth: { initialize: vi.fn(), signIn: vi.fn() },
}));

import { AuthProvider, useAuth } from '@features/auth/hooks/useAuth';
import { DEMO_UID, endDemo, isDemoActive, startDemo } from '@features/demo/demoSession';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth guest mode', () => {
  beforeEach(() => {
    localStorage.clear();
    endDemo();
    vi.clearAllMocks();
  });

  it('enterGuestMode signs in a stand-in guest without touching Firebase', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => firebaseMock.listener.emit!(null));

    act(() => result.current.enterGuestMode());

    expect(result.current.isGuest).toBe(true);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.currentUser?.uid).toBe(DEMO_UID);
    expect(isDemoActive()).toBe(true);
    expect(firebaseMock.db.collection).not.toHaveBeenCalled();
  });

  it('resumes a guest session after a reload without waiting for Firebase', () => {
    startDemo();
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isGuest).toBe(true);
    expect(result.current.loading).toBe(false);
  });

  it('a real sign-in always replaces a leftover guest session', () => {
    startDemo();
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() =>
      firebaseMock.listener.emit!({ uid: 'real-student-uid', email: '24je0001@iitism.ac.in' })
    );

    expect(result.current.isGuest).toBe(false);
    expect(result.current.currentUser?.uid).toBe('real-student-uid');
    expect(isDemoActive()).toBe(false);
  });

  it('logging out a guest ends the demo without calling Firebase', async () => {
    startDemo();
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => firebaseMock.listener.emit!(null));

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(isDemoActive()).toBe(false);
    expect(firebaseMock.auth.signOut).not.toHaveBeenCalled();
  });
});
