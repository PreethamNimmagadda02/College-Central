// FIX: Update Firebase imports to v8 compat syntax.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { db } from '../firebaseConfig';
import { ActivityType } from '../types';

export interface ActivityLog {
  type: ActivityType;
  title: string;
  description: string;
  icon: string;
  link?: string;
}

export const logActivity = async (userId: string, activity: ActivityLog) => {
  if (!userId) {
      console.warn("Attempted to log activity without a userId.");
      return;
  }
  try {
    // FIX: Use v8 compat syntax for collection reference and addDoc.
    const activityCollectionRef = db.collection('users').doc(userId).collection('activity');
    await activityCollectionRef.add({
      ...activity,
      // FIX: Use v8 compat syntax for serverTimestamp.
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error: any) {
    console.error("Error logging activity: ", error);
    if (error.code === 'permission-denied') {
        console.error(
            "Firestore Security Rules Error: The current user does not have permission to write to their own activity log. " +
            "Please ensure your Firestore rules allow writes on the 'users/{userId}/activity/{activityId}' path for authenticated users."
        );
    }
  }
};