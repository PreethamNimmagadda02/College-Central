import {
  NewsItem,
  DirectoryEntry,
  StudentDirectoryEntry,
  Announcement,
  CampusEvent,
} from '../types';
import { db } from '../firebaseConfig';
// FIX: Import QuerySnapshot and FirestoreError to fix type inference issues.
import { collection, query, orderBy, limit, onSnapshot, Unsubscribe, getDocs, where, QuerySnapshot, FirestoreError, DocumentData } from 'firebase/firestore';
import { CAMPUS_DIRECTORY } from '../data/directoryData';
import { STUDENT_DIRECTORY } from '../data/studentDirectoryData';

// --- Firestore API for Public Data ---

export function subscribeToAllNewsAndEvents(callback: (items: NewsItem[], error?: string) => void): Unsubscribe {
  try {
    let newsCache: NewsItem[] | null = null;
    let eventsCache: NewsItem[] | null = null;
    // FIX: Changed type from Error to FirestoreError to match onSnapshot's error callback.
    let newsError: FirestoreError | null = null;
    let eventsError: FirestoreError | null = null;

    const mergeAndCallback = () => {
      // Wait until both listeners have reported back at least once (either with data or error)
      if (newsCache === null || eventsCache === null) {
        return;
      }

      const allItems: NewsItem[] = [];
      if (Array.isArray(newsCache)) allItems.push(...newsCache);
      if (Array.isArray(eventsCache)) allItems.push(...eventsCache);
      
      allItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      const combinedError = newsError || eventsError;
      if (combinedError) {
        console.error("Error in news/events subscription:", combinedError);
      }
      callback(allItems, combinedError ? "Failed to load some updates." : undefined);
    };

    const newsQuery = query(collection(db, 'news'), orderBy('date', 'desc'));
    const eventsQuery = query(collection(db, 'events'), orderBy('date', 'desc'));

    // FIX: Explicitly type snapshot as QuerySnapshot and error as FirestoreError.
    const unsubNews = onSnapshot(newsQuery, (snapshot: QuerySnapshot<DocumentData>) => {
        newsError = null;
        newsCache = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, type: 'announcement' } as Announcement & { type: 'announcement' }));
        mergeAndCallback();
    }, (error: FirestoreError) => {
      console.error("Error subscribing to news:", error);
      newsError = error;
      newsCache = []; // On error, treat this source as empty
      mergeAndCallback();
    });

    // FIX: Explicitly type snapshot as QuerySnapshot and error as FirestoreError.
    const unsubEvents = onSnapshot(eventsQuery, (snapshot: QuerySnapshot<DocumentData>) => {
        eventsError = null;
        eventsCache = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, type: 'event' } as CampusEvent & { type: 'event' }));
        mergeAndCallback();
    }, (error: FirestoreError) => {
        console.error("Error subscribing to events:", error);
        eventsError = error;
        eventsCache = []; // On error, treat this source as empty
        mergeAndCallback();
    });

    return () => {
        unsubNews();
        unsubEvents();
    };
  } catch (error) {
    console.error(`Error setting up subscription for news-and-events:`, error);
    callback([], `Could not subscribe to updates. Please check your connection.`);
    return () => {}; // Return no-op unsubscribe function
  }
}

export function subscribeToLatestNewsAndEvents(count: number, callback: (items: NewsItem[], error?: string) => void): Unsubscribe {
  try {
    let newsCache: NewsItem[] | null = null;
    let eventsCache: NewsItem[] | null = null;
    // FIX: Changed type from Error to FirestoreError.
    let newsError: FirestoreError | null = null;
    let eventsError: FirestoreError | null = null;

    const mergeAndCallback = () => {
        if (newsCache === null || eventsCache === null) return;

        const allItems = [];
        if (Array.isArray(newsCache)) allItems.push(...newsCache);
        if (Array.isArray(eventsCache)) allItems.push(...eventsCache);

        // Sort by proximity to today's date (both past announcements and future events)
        const now = Date.now();
        allItems.sort((a, b) => {
            return Math.abs(new Date(a.date).getTime() - now) - Math.abs(new Date(b.date).getTime() - now);
        });
        
        const combinedError = newsError || eventsError;
        callback(allItems.slice(0, count), combinedError ? "Failed to load some updates." : undefined);
    }

    const today = new Date();
    today.setHours(0,0,0,0);
    const todayStr = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD for string comparison

    const newsQuery = query(collection(db, 'news'), orderBy('date', 'desc'), limit(count));
    // For events, get upcoming ones, ordered by date ascending (soonest first)
    const eventsQuery = query(collection(db, 'events'), where('date', '>=', todayStr), orderBy('date', 'asc'), limit(count));

    // FIX: Explicitly type snapshot as QuerySnapshot and error as FirestoreError.
    const unsubNews = onSnapshot(newsQuery, (snapshot: QuerySnapshot<DocumentData>) => {
        newsError = null;
        newsCache = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, type: 'announcement' } as Announcement & { type: 'announcement' }));
        mergeAndCallback();
    }, (error: FirestoreError) => {
      console.error("Error subscribing to latest news:", error);
      newsError = error;
      newsCache = [];
      mergeAndCallback();
    });

    // FIX: Explicitly type snapshot as QuerySnapshot and error as FirestoreError.
    const unsubEvents = onSnapshot(eventsQuery, (snapshot: QuerySnapshot<DocumentData>) => {
        eventsError = null;
        eventsCache = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, type: 'event' } as CampusEvent & { type: 'event' }));
        mergeAndCallback();
    }, (error: FirestoreError) => {
        console.error("Error subscribing to latest events:", error);
        eventsError = error;
        eventsCache = [];
        mergeAndCallback();
    });

    return () => {
        unsubNews();
        unsubEvents();
    };
  } catch (error) {
    console.error(`Error setting up subscription for latest news and events:`, error);
    callback([], `Could not subscribe to updates. Please check your connection.`);
    return () => {};
  }
}

// FIX: Added fetch functions to resolve export errors in components.
// These functions perform a one-time fetch, which aligns with the original component logic.
export const fetchAllNewsAndEvents = async (forceRefresh = false): Promise<NewsItem[]> => {
    // Note: forceRefresh is not implemented for Firestore fetch, as getDocs always gets latest data.
    const newsQuery = query(collection(db, 'news'), orderBy('date', 'desc'));
    const eventsQuery = query(collection(db, 'events'), orderBy('date', 'desc'));

    const [newsSnapshot, eventsSnapshot] = await Promise.all([getDocs(newsQuery), getDocs(eventsQuery)]);
    
    // FIX: Used Object.assign to resolve spread operator error on DocumentData type.
    const newsItems: NewsItem[] = newsSnapshot.docs.map(doc => (Object.assign({}, doc.data(), { id: doc.id, type: 'announcement' }) as Announcement & { type: 'announcement' }));
    const eventItems: NewsItem[] = eventsSnapshot.docs.map(doc => (Object.assign({}, doc.data(), { id: doc.id, type: 'event' }) as CampusEvent & { type: 'event' }));

    const allItems = [...newsItems, ...eventItems];
    allItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return allItems;
};

export const fetchLatestNewsAndEvents = async (count: number, forceRefresh = false): Promise<NewsItem[]> => {
    const allItems = await fetchAllNewsAndEvents(forceRefresh);
    return allItems.slice(0, count);
};

export const fetchAnnouncements = async (forceRefresh = false): Promise<Announcement[]> => {
    // Note: forceRefresh is not implemented for Firestore fetch.
    const newsQuery = query(collection(db, 'news'), orderBy('date', 'desc'));
    const newsSnapshot = await getDocs(newsQuery);
    // FIX: Used Object.assign to resolve spread operator error on DocumentData type.
    return newsSnapshot.docs.map(doc => (Object.assign({}, doc.data(), { id: doc.id }) as Announcement));
};


export const fetchDirectory = async (): Promise<DirectoryEntry[]> => {
    // await delay(1000); // Removed delay for faster loading
    return CAMPUS_DIRECTORY;
};

export const fetchStudentDirectory = async (): Promise<StudentDirectoryEntry[]> => {
    // await delay(1000);
    return STUDENT_DIRECTORY;
};