/**
 * Session Guard Component
 *
 * Wraps protected content to enforce session management.
 * Displays warning modal when session is about to expire.
 */

import { useAuth } from '@features/auth/hooks/useAuth';
import { useSessionManager, SessionWarningModal } from '@hooks/useSessionManager';
import React from 'react';

interface SessionGuardProps {
  children: React.ReactNode;
}

const ManagedSession: React.FC<SessionGuardProps> = ({ children }) => {
  const { showWarning, remainingSeconds, extendSession, logout } = useSessionManager();

  return (
    <>
      {children}
      {showWarning && (
        <SessionWarningModal
          remainingSeconds={remainingSeconds}
          onExtend={extendSession}
          onLogout={logout}
        />
      )}
    </>
  );
};

export const SessionGuard: React.FC<SessionGuardProps> = ({ children }) => {
  const { isGuest } = useAuth();

  // Guests hold no account, so the idle and max-session limits don't apply
  if (isGuest) {
    return <>{children}</>;
  }

  return <ManagedSession>{children}</ManagedSession>;
};

export default SessionGuard;
