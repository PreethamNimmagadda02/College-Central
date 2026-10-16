import { useAuth } from '@features/auth/hooks/useAuth';
import React from 'react';

/**
 * Remounts everything below it when a guest session starts or ends, so no provider
 * carries one identity's state into the other's (for example, writing the demo's
 * reminders into a real student's account after they sign in). Real students never
 * cross this boundary, so their app never remounts.
 */
export const GuestBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isGuest } = useAuth();
  return <React.Fragment key={isGuest ? 'guest' : 'member'}>{children}</React.Fragment>;
};
