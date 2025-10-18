// src/contexts/UserContext.tsx

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db, storage } from '../firebaseConfig';
import { User } from '../types';
import { STUDENT_DIRECTORY } from '../data/studentDirectoryData';
import { logActivity } from '../services/activityService';

interface UserContextType {
  user: User | null;
  updateUser: (newDetails: Partial<User>) => Promise<void>;
  uploadProfilePicture: (file: File) => Promise<void>;
  loading: boolean;
  error: Error | null; // ENHANCEMENT: Expose error state to the UI.
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null); // ENHANCEMENT: State for errors.

  useEffect(() => {
    let unsubscribeFromFirestore: (() => void) | null = null;

    const unsubscribeFromAuth = onAuthStateChanged(auth, async (authUser) => {
      if (unsubscribeFromFirestore) {
        unsubscribeFromFirestore();
      }
      setError(null); // Reset error on auth state change.

      if (authUser) {
        setLoading(true);
        const userDocRef = db.collection('users').doc(authUser.uid); // Use compat API

        unsubscribeFromFirestore = userDocRef.onSnapshot( // Use compat API
          async (snapshot) => {
            try {
              if (snapshot.exists) {
                // Correctly set user object, including the ID from the snapshot
                setUser({ id: snapshot.id, ...snapshot.data() } as User);
              } else {
                console.log("New user detected. Creating profile...");
                const admissionNumber = authUser.email?.split('@')[0]?.toUpperCase() ?? 'Unknown';
                const directoryEntry = STUDENT_DIRECTORY.find(student => student.admNo === admissionNumber);

                const newUserProfile: User = {
                  id: authUser.uid,
                  name: directoryEntry?.name ?? authUser.displayName ?? 'New Student',
                  admissionNumber: directoryEntry?.admNo ?? admissionNumber,
                  branch: directoryEntry?.branch ?? 'Not Set',
                  hostel: 'Not Set',
                  email: authUser.email ?? '',
                  phone: authUser.phoneNumber ?? 'Not Set',
                  profilePicture: authUser.photoURL ?? null,
                  profilePicturePath: null, // No path for external URLs
                };
                
                await userDocRef.set(newUserProfile); // Use compat API

                await logActivity(authUser.uid, {
                  type: 'login',
                  title: 'Account Created',
                  description: 'Welcome! Your account has been created.',
                  icon: '🎉',
                });
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
        const userDocRef = db.collection('users').doc(currentUserId); // Use compat API
        await userDocRef.update(newDetails); // Use compat API
        
        if (!newDetails.profilePicture) {
            await logActivity(currentUserId, {
                type: 'update',
                title: 'Profile Updated',
                description: 'Your profile information was successfully updated.',
                icon: '✏️',
                link: '/profile'
            });
        }
      } catch(e) {
        console.error("Failed to update user:", e);
        setError(e instanceof Error ? e : new Error('Failed to update profile.'));
        throw e;
      }
    }
  };
  
  const uploadProfilePicture = async (file: File) => {
    const currentUser = auth.currentUser;
    if (!currentUser || !user) throw new Error("Not authenticated or user data not loaded");

    const oldPhotoPath = user.profilePicturePath;

    if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file.');
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('File size should not exceed 5MB.');
    }
    
    const filePath = `profile_pictures/${currentUser.uid}/${Date.now()}_${file.name}`;
    const storageRef = storage.ref(filePath);
    const uploadTask = storageRef.put(file);

    return new Promise<void>((resolve, reject) => {
        uploadTask.on(
            'state_changed',
            null, // No progress updates needed for now
            (error) => {
                console.error("Upload failed: ", error);
                reject(error);
            },
            async () => {
                try {
                    const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                    
                    await currentUser.updateProfile({ photoURL: downloadURL });
                    await updateUser({ 
                        profilePicture: downloadURL,
                        profilePicturePath: filePath 
                    });
                    
                    await logActivity(currentUser.uid, {
                      type: 'update',
                      title: 'Profile Picture Updated',
                      description: 'Your profile picture was successfully changed.',
                      icon: '🖼️',
                      link: '/profile'
                    });

                    // After successful update, delete the old picture using its stored path
                    if (oldPhotoPath) {
                        try {
                            const oldImageRef = storage.ref(oldPhotoPath);
                            await oldImageRef.delete();
                            console.log("Old profile picture deleted successfully:", oldPhotoPath);
                        } catch (deleteError: any) {
                            // Non-blocking error: It's okay if the old file doesn't exist.
                            if (deleteError.code === 'storage/object-not-found') {
                                console.log("Old profile picture not found, nothing to delete. This is expected for the first upload or for external URLs.");
                            } else {
                                console.warn("Failed to delete old profile picture:", deleteError);
                            }
                        }
                    }

                    resolve();
                } catch (err) {
                     // If any update fails, try to delete the newly uploaded image to clean up storage.
                    try {
                        await storageRef.delete();
                    } catch (cleanupError) {
                        console.error("Failed to clean up newly uploaded image after an error:", cleanupError);
                    }
                    reject(err);
                }
            }
        );
    });
  };

  return (
    <UserContext.Provider value={{ user, updateUser, uploadProfilePicture, loading, error }}>
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
