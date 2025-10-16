import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { logActivity } from '../services/activityService';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    if (userCredential.user) {
        await logActivity(userCredential.user.uid, {
            type: 'login',
            title: 'Signed In',
            description: 'Successfully signed into your account.',
            icon: '🔑',
        });
    }
  };

  const register = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (userCredential.user) {
        await logActivity(userCredential.user.uid, {
            type: 'login',
            title: 'Account Created',
            description: 'Welcome! Your account has been created.',
            icon: '🎉',
        });
    }
  };

  const logout = async () => {
    if (currentUser) {
        await logActivity(currentUser.uid, {
            type: 'logout',
            title: 'Signed Out',
            description: 'Successfully signed out of your account.',
            icon: '👋',
        });
    }
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated: !!currentUser, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};