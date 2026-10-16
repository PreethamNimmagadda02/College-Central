// Firestore service for app configuration management
// Each config section is stored in a separate document within the appConfig collection
import { AdminConfig } from '@features/admin/types';
import { db } from '@lib/firebase';

import { ARRAY_CONFIG_KEYS, CONFIG_COLLECTION, CONFIG_DOCS, toConfigDocData } from './configDocs';

/**
 * Update a specific section of the app configuration
 */
export const updateConfigSection = async <K extends keyof AdminConfig>(
  section: K,
  data: AdminConfig[K]
): Promise<boolean> => {
  try {
    const docId = CONFIG_DOCS[section];
    const docRef = db.collection(CONFIG_COLLECTION).doc(docId);

    // For array-based configs, wrap in { items: [...] }
    if (ARRAY_CONFIG_KEYS.includes(section)) {
      await docRef.set({ items: data }, { merge: true });
    } else {
      // For object configs, replace entirely to ensure nested values sync
      await docRef.set(data as any);
    }

    return true;
  } catch (error) {
    console.error(`Error updating config section ${section}:`, error);
    return false;
  }
};

/**
 * Subscribe to real-time config updates
 * Listens to all documents in the collection and combines them
 * @returns Unsubscribe function
 */
export const subscribeToConfig = (callback: (config: AdminConfig | null) => void): (() => void) => {
  const validDocIds: string[] = Object.values(CONFIG_DOCS);
  let lastConfig: AdminConfig | null = null;

  return db.collection(CONFIG_COLLECTION).onSnapshot(
    { includeMetadataChanges: false }, // Reduce unnecessary triggers
    (snapshot) => {
      const config: Partial<AdminConfig> = {};
      snapshot.forEach((doc) => {
        if (!validDocIds.includes(doc.id)) return;
        const data = doc.data();
        (config as any)[doc.id] = ARRAY_CONFIG_KEYS.includes(doc.id) ? data.items || [] : data;
      });

      lastConfig = Object.keys(config).length > 0 ? (config as AdminConfig) : null;
      callback(lastConfig);
    },
    (error) => {
      console.error('Error in config subscription:', error);
      // Keep serving the last config we received, if any
      callback(lastConfig);
    }
  );
};

/**
 * Initialize config in Firestore if it doesn't exist
 * Creates separate documents for each config section
 * Also adds any missing sections if some exist but others don't
 */
export const initializeConfig = async (defaultConfig: AdminConfig): Promise<boolean> => {
  try {
    const collectionRef = db.collection(CONFIG_COLLECTION);
    const snapshot = await collectionRef.get();

    // Get existing document IDs
    const existingDocIds = new Set(snapshot.docs.map((doc) => doc.id));

    // Find missing sections
    const missingEntries = Object.entries(CONFIG_DOCS).filter(
      ([, docId]) => !existingDocIds.has(docId)
    );

    if (missingEntries.length === 0) {
      return true;
    }

    const batch = db.batch();

    missingEntries.forEach(([key, docId]) => {
      const section = key as keyof AdminConfig;
      batch.set(collectionRef.doc(docId), toConfigDocData(section, defaultConfig[section]));
    });

    await batch.commit();

    return true;
  } catch (error) {
    console.error('Error initializing config in Firestore:', error);
    return false;
  }
};
