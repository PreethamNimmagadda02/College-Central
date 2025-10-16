// src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
// CORRECT: Import modular functions from the Firebase v9 SDK
import {
    User,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import { auth } from '../firebaseConfig'; // This should export the v9 `auth` object
import { logActivity } from '../services/activityService';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged is the recommended way to listen for auth changes.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    // Clean up the listener when the component unmounts.
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Use the v9 modular function
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await logActivity(userCredential.user.uid, {
        type: 'login',
        title: 'Signed In',
        description: 'Successfully signed into your account.',
        icon: '🔑',
      });
    } catch (error) {
      console.error("Login failed:", error);
      // Re-throw the error so the UI can catch it and display a message
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await logActivity(userCredential.user.uid, {
        type: 'login',
        title: 'Account Created',
        description: 'Welcome! Your account has been created.',
        icon: '🎉',
      });
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // ✅ 1. Check if there's a user to log out.
      if (currentUser) {
        // ✅ 2. Log the sign-out activity WHILE the user is still authenticated.
        await logActivity(currentUser.uid, {
            type: 'logout',
            title: 'Signed Out',
            description: 'Successfully signed out of your account.',
            icon: '👋',
        });
      }
      // ✅ 3. Now, perform the sign-out.
      await signOut(auth);
    } catch (error) {
        console.error("Logout process failed:", error);
        // Fallback: If any part of the process fails (like the database write),
        // ensure the user is still signed out as a final action.
        if (auth.currentUser) {
            await signOut(auth);
        }
        // Re-throw the error so the UI can be notified if needed.
        throw error;
    }
  };
  
  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated: !!currentUser, login, register, logout, loading }}>
      {/* Always render children to let the UI handle the loading state */}
      {children}
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