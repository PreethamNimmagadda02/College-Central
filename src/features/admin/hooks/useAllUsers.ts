import { db } from '@lib/firebase';
import { useCallback, useEffect, useState } from 'react';

import { User } from '@/types';

// Loads every user document once; the analytics and broadcast pages filter client-side
export const useAllUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snapshot = await db.collection('users').get();
      setUsers(snapshot.docs.map((doc) => ({ ...(doc.data() as User), id: doc.id })));
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { users, loading, error, refresh };
};
