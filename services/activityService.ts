// FIX: Update Firebase imports to v8 compat syntax.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { db } from '../firebaseConfig';
import { ActivityType, ActivityItem } from '../types';
import { retryOnlyIfRetryable } from '../utils/retryLogic';
import { ACTIVITY_LOG_MAX_RETRIES, ACTIVITY_LOG_RETRY_DELAY_MS, ACTIVITY_LOG_PAGE_SIZE } from '../utils/constants';

export interface ActivityLog {
  type: ActivityType;
  title: string;
  description: string;
  icon: string;
  link?: string;
}

export interface ActivityLogPage {
  activities: ActivityItem[];
  lastDoc: firebase.firestore.QueryDocumentSnapshot | null;
  hasMore: boolean;
}

export const logActivity = async (userId: string, activity: ActivityLog) => {
  if (!userId) {
      console.warn("Attempted to log activity without a userId.");
      return;
  }
  try {
    // Use retry logic for network resilience
    await retryOnlyIfRetryable(async () => {
      // FIX: Use v8 compat syntax for collection reference and addDoc.
      const activityCollectionRef = db.collection('users').doc(userId).collection('activity');
      await activityCollectionRef.add({
        ...activity,
        // FIX: Use v8 compat syntax for serverTimestamp.
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
    }, ACTIVITY_LOG_MAX_RETRIES, ACTIVITY_LOG_RETRY_DELAY_MS);
  } catch (error: any) {
    console.error("Error logging activity: ", error);
    if (error.code === 'permission-denied') {
        console.error(
            "Firestore Security Rules Error: The current user does not have permission to write to their own activity log. " +
            "Please ensure your Firestore rules allow writes on the 'users/{userId}/activity/{activityId}' path for authenticated users."
        );
    }
    // Don't throw - activity logging is non-critical
  }
};

/**
 * Fetch activity logs with pagination
 * @param userId - User ID to fetch activities for
 * @param lastDoc - Last document from previous page (for pagination)
 * @param pageSize - Number of activities per page
 * @returns ActivityLogPage with activities and pagination info
 */
export const fetchActivityLogs = async (
  userId: string,
  lastDoc: firebase.firestore.QueryDocumentSnapshot | null = null,
  pageSize: number = ACTIVITY_LOG_PAGE_SIZE
): Promise<ActivityLogPage> => {
  if (!userId) {
    throw new Error('userId is required to fetch activity logs');
  }

  try {
    const activityCollectionRef = db
      .collection('users')
      .doc(userId)
      .collection('activity')
      .orderBy('timestamp', 'desc')
      .limit(pageSize + 1); // Fetch one extra to check if there are more

    // If we have a lastDoc, start after it
    const query = lastDoc
      ? activityCollectionRef.startAfter(lastDoc)
      : activityCollectionRef;

    const snapshot = await query.get();
    const docs = snapshot.docs;

    // Check if there are more items
    const hasMore = docs.length > pageSize;
    const activities = docs.slice(0, pageSize).map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ActivityItem[];

    // Get the last doc for next page
    const newLastDoc = hasMore ? docs[pageSize - 1] : null;

    return {
      activities,
      lastDoc: newLastDoc,
      hasMore,
    };
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    throw error;
  }
};