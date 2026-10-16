import { useAuth } from '@features/auth/hooks/useAuth';
import { useRole } from '@features/auth/hooks/useRole';
import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Also require the admin role; signed-in non-admins go to the dashboard */
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useRole();

  if (authLoading || (requireAdmin && roleLoading)) {
    return (
      <div className="flex items-center justify-center h-screen bg-light-bg dark:bg-dark-bg">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-transparent border-primary rounded-full animate-spin mx-auto"></div>
          {requireAdmin && (
            <p className="mt-4 text-slate-500 dark:text-slate-400">Verifying access...</p>
          )}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export default ProtectedRoute;
