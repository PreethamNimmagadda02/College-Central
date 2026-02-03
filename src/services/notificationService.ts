import { db } from '@lib/firebase';
import { NotificationFilter } from '@/types';
import { collection, getDocs, serverTimestamp, query, where, writeBatch, doc } from 'firebase/firestore';

/**
 * Send a targeted broadcast to users matching the filter criteria.
 * @param filter - Criteria to filter users (branch, year, hostel, courseOption)
 * @param title - Title of the notification
 * @param body - Body of the notification
 * @param type - Type of notification (info, warning, success, error, event)
 * @param link - Optional link to include in the notification
 */
export const sendBroadcast = async (
    filter: NotificationFilter,
    title: string,
    body: string,
    type: 'info' | 'warning' | 'success' | 'error' | 'event' = 'info',
    link?: string
): Promise<{ success: boolean; count: number; error?: string }> => {
    try {
        // 1. Fetch all users
        // Note: In a real production app with thousands of users, we would do this using a Cloud Function
        // to avoid fetching all user documents to the client. For < 500 users, this is acceptable.
        const usersRef = collection(db, 'users');
        let q = query(usersRef);

        // Initial query filtering if possible (though Firestore has limitations on multiple inequalities)
        // We filter in memory to handle case-insensitivity correctly for existing data
        /* 
        if (filter.branch && filter.branch !== 'All') {
            q = query(q, where('branch', '==', filter.branch));
        }
        */

        // We fetch and then filter in memory for complex combinations (year via email regex, etc.)
        const querySnapshot = await getDocs(q);

        let targetUsers: string[] = [];

        querySnapshot.forEach((doc) => {
            const userData = doc.data();
            const userId = doc.id;

            // Apply filters
            let match = true;

            // Filter by Branch (Case insensitive)
            // Note: We removed the initial query filter to ensure we catch mixed-case branches
            if (filter.branch && filter.branch !== 'All' &&
                (userData.branch || '').toLowerCase() !== filter.branch.toLowerCase()) {
                match = false;
            }

            // Filter by Hostel (Case insensitive)
            if (match && filter.hostel && filter.hostel !== 'All' &&
                (userData.hostel || '').toLowerCase() !== filter.hostel.toLowerCase()) {
                match = false;
            }

            // Filter by Course Option
            if (match && filter.courseOption && userData.courseOption !== filter.courseOption) {
                match = false;
            }

            // Filter by Year (requires parsing email)
            if (match && filter.year && filter.year !== 'All') {
                const email = userData.email || '';
                const prefix = email.split('@')[0];
                const yearMatch = prefix.match(/^(\d{2})/);
                if (yearMatch && yearMatch[1]) {
                    const yearNum = parseInt(yearMatch[1], 10);
                    const fullYear = yearNum < 50 ? 2000 + yearNum : 1900 + yearNum;
                    if (String(fullYear) !== filter.year) {
                        match = false;
                    }
                } else if (filter.year !== 'Other') {
                    // If filtering for a specific year but user has no year in email, exclude them
                    // Unless we are filtering for "Other"
                    match = false;
                }
            }

            if (match) {
                targetUsers.push(userId);
            }
        });

        if (targetUsers.length === 0) {
            return { success: true, count: 0 };
        }

        // 2. Batch write notifications
        // Firestore batch limit is 500 operations
        const batchSize = 450;
        const batches = [];

        for (let i = 0; i < targetUsers.length; i += batchSize) {
            const batch = writeBatch(db);
            const chunk = targetUsers.slice(i, i + batchSize);

            chunk.forEach((userId) => {
                const notifRef = collection(db, `users/${userId}/notifications`);
                // We use addDoc-like behavior but within a batch
                const newDocRef = doc(notifRef);
                batch.set(newDocRef, {
                    title,
                    body,
                    type,
                    read: false,
                    createdAt: serverTimestamp(),
                    link: link || null,
                    sender: 'Admin Broadcast'
                });
            });

            batches.push(batch.commit());
        }

        await Promise.all(batches);

        return { success: true, count: targetUsers.length };

    } catch (error) {
        console.error("Error sending broadcast:", error);
        return { success: false, count: 0, error: error instanceof Error ? error.message : "Unknown error" };
    }
};
