import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/types';
import { PublicProfile } from '@/features/profiles/components/PublicProfile';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Loader2, ArrowLeft } from 'lucide-react';

const UserProfile = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            if (!userId) return;
            setLoading(true);
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

        fetchUser();
    }, [userId]);

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
                    onClick={() => navigate(-1)}
                    className="px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
                >
                    Go Back
                </button>
            </div>
        );
    }

    const isOwnProfile = currentUser?.uid === user.id;

    return (
        <div className="max-w-7xl mx-auto p-4 lg:p-6 pb-20">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors"
            >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
            </button>

            <PublicProfile
                user={user}
                isOwnProfile={isOwnProfile}
                onEdit={() => {
                    if (isOwnProfile) {
                        navigate('/profile'); // Redirect to their own editable profile page
                    }
                }}
            />
        </div>
    );
};

export default UserProfile;
