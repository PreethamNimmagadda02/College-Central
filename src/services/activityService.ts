// FIX: Update Firebase imports to v8 compat syntax.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { isDemoUid } from '@features/demo/demoSession';
import { addDemoActivity } from '@features/demo/demoStore';
import { db } from '@lib/firebase';
import {
  ACTIVITY_LOG_MAX_RETRIES,
  ACTIVITY_LOG_RETRY_DELAY_MS,
  MAX_ACTIVITIES_STORED,
} from '@lib/utils/constants';
import { isFirebaseError } from '@lib/utils/helpers';
import { retryOnlyIfRetryable } from '@lib/utils/retryLogic';

import { ActivityType } from '@/types';

interface ActivityLog {
  type: ActivityType;
  title: string;
  description: string;
  icon: string;
  link?: string;
}

export const logActivity = async (userId: string, activity: ActivityLog) => {
  if (!userId) {
    console.warn('Attempted to log activity without a userId.');
    return;
  }
  if (isDemoUid(userId)) {
    // Guests keep their activity feed in the local demo store
    addDemoActivity(activity);
    return;
  }
  try {
    // Use retry logic for network resilience
    await retryOnlyIfRetryable(
      async () => {
        const activityCollectionRef = db.collection('users').doc(userId).collection('activity');

        // Add new activity
        await activityCollectionRef.add({
          ...activity,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });

        // Note: Cleanup is now handled separately via cleanupOldActivities()
        // which is called on login/logout to avoid expensive reads on every activity log
      },
      ACTIVITY_LOG_MAX_RETRIES,
      ACTIVITY_LOG_RETRY_DELAY_MS
    );
  } catch (error: unknown) {
    console.error('Error logging activity: ', error);
    if (isFirebaseError(error) && error.code === 'permission-denied') {
      console.error(
        'Firestore Security Rules Error: The current user does not have permission to write to their own activity log. ' +
          "Please ensure your Firestore rules allow writes on the 'users/{userId}/activity/{activityId}' path for authenticated users."
      );
    }
    // Don't throw - activity logging is non-critical
  }
};

/**
 * Clean up old activities for a user - keep only latest 30
 * This can be called manually or on app initialization
 * @param userId - User ID to clean up activities for
 */
export const cleanupOldActivities = async (userId: string): Promise<void> => {
  if (!userId) {
    console.warn('Attempted to cleanup activities without a userId.');
    return;
  }
  if (isDemoUid(userId)) return; // the demo store caps its own feed

  try {
    const activityCollectionRef = db.collection('users').doc(userId).collection('activity');

    const allActivities = await activityCollectionRef.orderBy('timestamp', 'desc').get();

    // If we have more than MAX_ACTIVITIES_STORED, delete the oldest ones
    if (allActivities.size > MAX_ACTIVITIES_STORED) {
      const batch = db.batch();
      const activitiesToDelete = allActivities.docs.slice(MAX_ACTIVITIES_STORED);

      activitiesToDelete.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    }
  } catch (error) {
    console.error('Error cleaning up old activities:', error);
    // Don't throw - cleanup is non-critical
  }
};
