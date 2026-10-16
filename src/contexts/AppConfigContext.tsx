import { generateDefaultConfig } from '@config/defaultConfig';
import { AdminConfig } from '@features/admin/types';
import { useAuth } from '@features/auth/hooks/useAuth';
import { getDemoState } from '@features/demo/demoStore';
import { subscribeToConfig, initializeConfig } from '@services/configService';
import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';

interface AppConfigContextType {
  config: AdminConfig;
  loading: boolean;
}

const AppConfigContext = createContext<AppConfigContextType | undefined>(undefined);

export const AppConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isGuest } = useAuth();
  const [config, setConfig] = useState<AdminConfig>(generateDefaultConfig);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isGuest) {
      // Guests get the bundled config with fictional classmates in place of the real
      // student list, so the demo makes no Firebase calls at all. Its calendar is left
      // empty so CalendarContext shifts the bundled calendar to the current year.
      const defaults = generateDefaultConfig();
      setConfig({
        ...defaults,
        students: getDemoState().directory,
        calendar: { ...defaults.calendar, events: [] },
      });
      setLoading(false);
      return;
    }

    setLoading(true);

    // Initialize config if it doesn't exist
    const defaultConfig = generateDefaultConfig();
    initializeConfig(defaultConfig).catch(console.error);

    // Subscribe to real-time updates - this is independent of auth
    // Config is read-only and should always be available
    const unsubscribe = subscribeToConfig((firestoreConfig) => {
      // Fall back to the bundled defaults when Firestore has no config
      setConfig(firestoreConfig ?? defaultConfig);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [isGuest]); // Re-runs only when a guest session starts or ends

  const contextValue = useMemo(() => ({ config, loading }), [config, loading]);

  return <AppConfigContext.Provider value={contextValue}>{children}</AppConfigContext.Provider>;
};

export const useAppConfig = (): AppConfigContextType => {
  const context = useContext(AppConfigContext);
  if (context === undefined) {
    throw new Error('useAppConfig must be used within an AppConfigProvider');
  }
  return context;
};
