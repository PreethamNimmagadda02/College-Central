// src/contexts/UserContext.tsx

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, onSnapshot, updateDoc, Unsubscribe } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { User } from '../types';
import { STUDENT_DIRECTORY } from '../data/studentDirectoryData';
import { logActivity } from '../services/activityService';

interface UserContextType {
  user: User | null;
  updateUser: (newDetails: Partial<User>) => Promise<void>;
  loading: boolean;
  error: Error | null; // ENHANCEMENT: Expose error state to the UI.
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null); // ENHANCEMENT: State for errors.

  useEffect(() => {
    let unsubscribeFromFirestore: Unsubscribe | null = null;

    const unsubscribeFromAuth = onAuthStateChanged(auth, async (authUser) => {
      if (unsubscribeFromFirestore) {
        unsubscribeFromFirestore();
      }
      setError(null); // Reset error on auth state change.

      if (authUser) {
        setLoading(true);
        const userDocRef = doc(db, 'users', authUser.uid);

        unsubscribeFromFirestore = onSnapshot(userDocRef, 
          async (snapshot) => {
            try {
              if (snapshot.exists()) {
                setUser(snapshot.data() as User);
              } else {
                console.log("New user detected. Creating profile...");
                const admissionNumber = authUser.email?.split('@')[0]?.toUpperCase() ?? 'Unknown';
                const directoryEntry = STUDENT_DIRECTORY.find(student => student.admNo === admissionNumber);

                const newUserProfile: User = {
                  id: authUser.uid,
                  name: directoryEntry?.name ?? 'New Student',
                  admissionNumber: directoryEntry?.admNo ?? admissionNumber,
                  branch: directoryEntry?.branch ?? 'Not Set',
                  hostel: 'Not Set',
                  email: authUser.email ?? '',
                  phone: 'Not Set',
                };
                
                await setDoc(userDocRef, newUserProfile);

                // ENHANCEMENT: Log account creation after the profile is successfully created.
                await logActivity(authUser.uid, {
                  type: 'login',
                  title: 'Account Created',
                  description: 'Welcome! Your account has been created.',
                  icon: '🎉',
                });
                // The listener will auto-update the user state with the new profile.
              }
            } catch (e) {
              console.error("Error processing user profile:", e);
              setError(e instanceof Error ? e : new Error('An unknown error occurred.'));
              setUser(null);
            } finally {
              setLoading(false);
            }
          }, 
          (err) => { // This block catches listener-specific errors
            console.error("Error with user profile snapshot:", err);
            setError(err);
            setUser(null);
            setLoading(false);
          }
        );
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeFromAuth();
      if (unsubscribeFromFirestore) {
        unsubscribeFromFirestore();
      }
    };
  }, []);


  const updateUser = async (newDetails: Partial<User>) => {
    const currentUserId = auth.currentUser?.uid;
    if (currentUserId) {
      try {
        const userDocRef = doc(db, 'users', currentUserId);
        await updateDoc(userDocRef, newDetails);
        await logActivity(currentUserId, {
          type: 'update',
          title: 'Profile Updated',
          description: 'Your profile information was successfully updated.',
          icon: '✏️',
          link: '/profile'
        });
      } catch(e) {
        console.error("Failed to update user:", e);
        setError(e instanceof Error ? e : new Error('Failed to update profile.'));
      }
    }
  };

  return (
    <UserContext.Provider value={{ user, updateUser, loading, error }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};