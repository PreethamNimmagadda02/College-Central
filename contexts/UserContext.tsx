import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebaseConfig';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { STUDENT_DIRECTORY } from '../data/studentDirectoryData';

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
      
      const unsubscribe = onSnapshot(userDocRef, async (docSnap) => {
        if (docSnap.exists()) {
          // Document exists, update state
          setUser(docSnap.data() as User);
          setLoading(false);
        } else {
          // Document does not exist, so this is a new user. Create it.
          const admissionNumber = currentUser.email?.split('@')[0]?.toUpperCase() || 'Unknown';
          
          // Find user in the student directory
          const directoryEntry = STUDENT_DIRECTORY.find(student => student.admNo === admissionNumber);

          let newUserProfile: User;

          if (directoryEntry) {
            // Found in directory, create profile from directory data
            newUserProfile = {
              id: currentUser.uid,
              name: directoryEntry.name,
              admissionNumber: directoryEntry.admNo,
              branch: directoryEntry.branch,
              hostel: 'Not Set',
              email: currentUser.email || '',
              phone: 'Not Set',
            };
          } else {
            // Not found, create default profile
            newUserProfile = {
              id: currentUser.uid,
              name: 'New Student',
              admissionNumber: admissionNumber,
              branch: 'Not Set',
              hostel: 'Not Set',
              email: currentUser.email || '',
              phone: 'Not Set',
            };
          }

          try {
            await setDoc(userDocRef, newUserProfile);
            // After setting, the onSnapshot listener will be re-triggered with the new data.
            // We don't need to call setUser or setLoading here, as the re-triggered listener will handle it.
          } catch (error) {
            console.error("Error creating user profile:", error);
            setLoading(false); // Error occurred, stop loading
          }
        }
      }, (error) => {
        console.error("Error with user profile snapshot:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setUser(null);
      setLoading(false);
      return () => {}; // Return no-op cleanup
    }
  }, [currentUser]);


  const updateUser = async (newDetails: Partial<User>) => {
    if (currentUser) {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, newDetails);
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