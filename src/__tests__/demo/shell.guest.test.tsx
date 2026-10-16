import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authMock = vi.hoisted(() => ({ value: {} as Record<string, unknown> }));
const sessionMock = vi.hoisted(() => ({
  useSessionManager: vi.fn(() => ({
    showWarning: true,
    remainingSeconds: 30,
    extendSession: vi.fn(),
    logout: vi.fn(),
  })),
}));

vi.mock('@features/auth/hooks/useAuth', () => ({ useAuth: () => authMock.value }));
vi.mock('@contexts/LocationContext', () => ({
  useLocation: () => ({
    permissionStatus: 'denied',
    error: 'User denied the request for Geolocation.',
    loading: false,
    location: null,
    retryLocation: vi.fn(),
  }),
}));
vi.mock('@hooks/useSessionManager', () => ({
  useSessionManager: sessionMock.useSessionManager,
  SessionWarningModal: () => <div>Session expiring</div>,
}));

import { LocationRequirement } from '@components/common/LocationRequirement';
import SessionGuard from '@components/common/SessionGuard';
import { DemoBanner } from '@features/demo/DemoBanner';
import { getDemoState, resetDemoStoreForTests, updateDemoProfile } from '@features/demo/demoStore';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('LocationRequirement', () => {
  const renderGate = () =>
    render(
      <LocationRequirement>
        <p>App content</p>
      </LocationRequirement>
    );

  it('lets guests in without a location', () => {
    authMock.value = { isGuest: true, isAuthenticated: true };
    renderGate();
    expect(screen.getByText('App content')).toBeInTheDocument();
  });

  it('lets signed-out visitors reach the login page', () => {
    authMock.value = { isGuest: false, isAuthenticated: false };
    renderGate();
    expect(screen.getByText('App content')).toBeInTheDocument();
  });

  it('still requires location from signed-in students', () => {
    authMock.value = { isGuest: false, isAuthenticated: true };
    renderGate();
    expect(screen.getByText('Location Access Required')).toBeInTheDocument();
    expect(screen.queryByText('App content')).not.toBeInTheDocument();
  });
});

describe('SessionGuard', () => {
  beforeEach(() => {
    sessionMock.useSessionManager.mockClear();
  });

  it('skips session timeouts for guests', () => {
    authMock.value = { isGuest: true };
    render(
      <SessionGuard>
        <p>App content</p>
      </SessionGuard>
    );
    expect(screen.getByText('App content')).toBeInTheDocument();
    expect(screen.queryByText('Session expiring')).not.toBeInTheDocument();
    expect(sessionMock.useSessionManager).not.toHaveBeenCalled();
  });

  it('keeps session timeouts for students', () => {
    authMock.value = { isGuest: false };
    render(
      <SessionGuard>
        <p>App content</p>
      </SessionGuard>
    );
    expect(screen.getByText('Session expiring')).toBeInTheDocument();
  });
});

describe('DemoBanner', () => {
  beforeEach(() => {
    localStorage.clear();
    resetDemoStoreForTests();
  });

  const renderBanner = () =>
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<DemoBanner />} />
          <Route path="/login" element={<p>Login page</p>} />
        </Routes>
      </MemoryRouter>
    );

  it('renders nothing for students', () => {
    authMock.value = { isGuest: false };
    const { container } = renderBanner();
    expect(container).toBeEmptyDOMElement();
  });

  it('resets the demo after confirmation', () => {
    authMock.value = { isGuest: true, logout: vi.fn() };
    updateDemoProfile({ bio: 'Changed' });
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderBanner();
    expect(
      screen.getByText("You're exploring College Central with sample data.")
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reset demo' }));

    expect(getDemoState().profile.bio).not.toBe('Changed');
  });

  it('keeps changes when the reset is cancelled', () => {
    authMock.value = { isGuest: true, logout: vi.fn() };
    updateDemoProfile({ bio: 'Changed' });
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderBanner();
    fireEvent.click(screen.getByRole('button', { name: 'Reset demo' }));

    expect(getDemoState().profile.bio).toBe('Changed');
  });

  it('exits to the login page', async () => {
    const logout = vi.fn(async () => {});
    authMock.value = { isGuest: true, logout };

    renderBanner();
    fireEvent.click(screen.getByRole('button', { name: 'Exit demo' }));

    expect(await screen.findByText('Login page')).toBeInTheDocument();
    expect(logout).toHaveBeenCalled();
  });
});
