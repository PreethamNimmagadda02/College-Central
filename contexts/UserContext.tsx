import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebaseConfig';
import { doc, onSnapshot, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { STUDENT_DIRECTORY } from '../data/studentDirectoryData';
import { logActivity } from '../services/activityService';

interface UserContextType {
  user: User | null;
  updateUser: (newDetails: Partial<User>) => Promise<void>;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      setLoading(true);
      const userDocRef = doc(db, 'users', currentUser.uid);

      // This function will check for user existence, create if new, and then start listening.
      const setupAndListen = async () => {
        try {
          // Perform a one-time check to see if the user document exists.
          const docSnap = await getDoc(userDocRef);

          if (!docSnap.exists()) {
            // Document does not exist, so this is a new user. Create it.
            const admissionNumber = currentUser.email?.split('@')[0]?.toUpperCase() || 'Unknown';
            const directoryEntry = STUDENT_DIRECTORY.find(student => student.admNo === admissionNumber);

            const newUserProfile: User = directoryEntry
              ? {
                  id: currentUser.uid,
                  name: directoryEntry.name,
                  admissionNumber: directoryEntry.admNo,
                  branch: directoryEntry.branch,
                  hostel: 'Not Set',
                  email: currentUser.email || '',
                  phone: 'Not Set',
                }
              : {
                  id: currentUser.uid,
                  name: 'New Student',
                  admissionNumber: admissionNumber,
                  branch: 'Not Set',
                  hostel: 'Not Set',
                  email: currentUser.email || '',
                  phone: 'Not Set',
                };
            
            // Create the document for the new user.
            await setDoc(userDocRef, newUserProfile);
          }
        } catch (error) {
          console.error("Error during user profile setup check:", error);
          // Even if setup fails, we'll still try to listen for the document.
        }

        // After the initial check/creation, attach the real-time listener.
        const unsubscribe = onSnapshot(userDocRef, 
          (docSnap) => {
            if (docSnap.exists()) {
              setUser(docSnap.data() as User);
            } else {
              // This might happen if the doc is deleted, or if creation failed and we're listening.
              setUser(null);
            }
            setLoading(false);
          }, 
          (error) => {
            console.error("Error with user profile snapshot:", error);
            setUser(null);
            setLoading(false);
          }
        );

        return unsubscribe;
      };

      let unsubscribe: () => void = () => {};
      
      setupAndListen().then(unsubFunc => {
        if (unsubFunc) {
          unsubscribe = unsubFunc;
        }
      });

      // Cleanup function for the useEffect hook.
      return () => {
        unsubscribe();
      };

    } else {
      // No user is logged in.
      setUser(null);
      setLoading(false);
      return () => {}; // Return no-op cleanup
    }
  }, [currentUser]);


  const updateUser = async (newDetails: Partial<User>) => {
    if (currentUser) {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, newDetails);
      await logActivity(currentUser.uid, {
        type: 'update',
        title: 'Profile Updated',
        description: 'Your profile information was successfully updated.',
        icon: '✏️',
        link: '/profile'
      });
    }
  };

  return (
    <UserContext.Provider value={{ user, updateUser, loading }}>
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