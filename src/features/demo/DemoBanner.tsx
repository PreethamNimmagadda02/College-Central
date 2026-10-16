import { useAuth } from '@features/auth/hooks/useAuth';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { resetDemoState } from './demoStore';

/** Always visible while a guest explores, so it's clear the data is sample data. */
export const DemoBanner: React.FC = () => {
  const { isGuest, logout } = useAuth();
  const navigate = useNavigate();

  if (!isGuest) return null;

  const handleReset = () => {
    if (
      window.confirm('Reset the demo? Your changes will be replaced with the original sample data.')
    ) {
      resetDemoState();
      toast.success('Demo data reset');
    }
  };

  const handleExit = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 py-2 text-sm bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100 border-b border-amber-200 dark:border-amber-800"
    >
      <span>You're exploring College Central with sample data.</span>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleReset}
          className="font-semibold underline underline-offset-2 hover:no-underline"
        >
          Reset demo
        </button>
        <button
          type="button"
          onClick={handleExit}
          className="font-semibold underline underline-offset-2 hover:no-underline"
        >
          Exit demo
        </button>
      </div>
    </div>
  );
};
