import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/types';
import { PublicProfile } from '@/features/profiles/components/PublicProfile';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { Loader2, ArrowLeft, Home } from 'lucide-react';

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const fetchUser = async () => {
    if (!userId) return;
    // Don't set loading to true on refetch to avoid flicker
    if (!user) setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setUser({ id: userDoc.id, ...userDoc.data() } as User);
      } else {
        setError('User not found');
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const handleSave = () => {
    // Refresh user data after save
    fetchUser();
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          {error || 'User not found'}
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          The profile you are looking for does not exist or may have been removed.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
        >
          Go Home
        </button>
      </div>
    );
  }

  const isOwnProfile = currentUser?.uid === user.id;

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-6 pb-20">
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors group"
        >
          <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm group-hover:shadow-md transition-all border border-slate-200 dark:border-slate-700">
            {isOwnProfile ? <Home className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
          </div>
          <span className="font-medium">{isOwnProfile ? 'Dashboard' : 'Back'}</span>
        </button>
      </div>

      <PublicProfile
        user={user}
        isOwnProfile={isOwnProfile}
        isEditing={isEditing}
        onEdit={() => setIsEditing(true)}
        onSave={handleSave}
        onCancel={() => setIsEditing(false)}
      />
    </div>
  );
};

export default UserProfile;
