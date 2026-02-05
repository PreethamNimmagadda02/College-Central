// hooks/useRole.tsx
// Role management hook for determining user access level

import { useAppConfig } from '@contexts/AppConfigContext';
import { useUser } from '@contexts/UserContext';
import { db } from '@lib/firebase';
import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';

import { useAuth } from './useAuth';

interface RoleContextType {
  role: 'user' | 'admin';
  isAdmin: boolean;
  isLoading: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser, loading: authLoading } = useAuth();
  const { loading: userLoading } = useUser();
  const { loading: configLoading } = useAppConfig();
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const determineRole = async () => {
      // Wait for all dependencies to load
      if (authLoading || userLoading || configLoading) {
        setIsLoading(true);
        return;
      }

      // No authenticated user
      if (!currentUser || !currentUser.email) {
        setRole('user');
        setIsLoading(false);
        return;
      }

      try {
        // Check if user's email is in the adminEmails collection
        const adminEmailsDoc = await db.collection('appConfig').doc('adminEmails').get();

        if (adminEmailsDoc.exists) {
          const adminEmails: string[] = adminEmailsDoc.data()?.items || [];
          const userEmail = currentUser.email.toLowerCase();

          if (adminEmails.map(e => e.toLowerCase()).includes(userEmail)) {
            setRole('admin');
          } else {
            setRole('user');
          }
        } else {
          setRole('user');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setRole('user');
      }

      setIsLoading(false);
    };

    determineRole();
  }, [currentUser, authLoading, userLoading, configLoading]);

  const contextValue = useMemo(
    () => ({
      role,
      isAdmin: role === 'admin',
      isLoading,
    }),
    [role, isLoading]
  );

  return <RoleContext.Provider value={contextValue}>{children}</RoleContext.Provider>;
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
