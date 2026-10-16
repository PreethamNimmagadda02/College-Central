import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const authMock = vi.hoisted(() => ({
  value: {} as Record<string, unknown>,
  enterGuestMode: vi.fn(),
  loginWithGoogle: vi.fn(),
}));

vi.mock('@features/auth/hooks/useAuth', () => ({ useAuth: () => authMock.value }));
vi.mock('@contexts/AppConfigContext', () => ({ useAppConfig: () => ({ config: {} }) }));

import Login from '@pages/Login';

const signedOut = (loading: boolean) => ({
  isAuthenticated: false,
  loading,
  enterGuestMode: authMock.enterGuestMode,
  loginWithGoogle: authMock.loginWithGoogle,
});

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

describe('Login page for visitors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the landing page once auth settles, without crashing its scroll animations', () => {
    authMock.value = signedOut(true);
    const { rerender } = renderLogin();

    authMock.value = signedOut(false);
    rerender(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: 'Explore as guest' })).toBeInTheDocument();
  });

  it('enters guest mode from the login page', () => {
    authMock.value = signedOut(false);
    renderLogin();

    fireEvent.click(screen.getByRole('button', { name: 'Explore as guest' }));

    expect(authMock.enterGuestMode).toHaveBeenCalled();
  });
});
