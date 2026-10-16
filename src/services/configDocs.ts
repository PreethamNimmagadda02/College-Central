// How the app configuration is laid out in Firestore: one document per section in the
// appConfig collection. Kept free of Firebase imports so scripts/seedFirestore.mjs can share it.
import { AdminConfig } from '@features/admin/types';

export const CONFIG_COLLECTION = 'appConfig';

// Document IDs for each config section
export const CONFIG_DOCS = {
  collegeInfo: 'collegeInfo',
  appConstants: 'appConstants',
  branches: 'branches',
  hostels: 'hostels',
  quotes: 'quotes',
  quickLinks: 'quickLinks',
  forms: 'forms',
  calendar: 'calendar',
  directory: 'directory',
  courses: 'courses',
  students: 'students',
  campusMap: 'campusMap',
  quickRoutes: 'quickRoutes',
  gradingScale: 'gradingScale',
} as const satisfies Record<keyof AdminConfig, string>;

// Config sections that are arrays and need to be wrapped in { items: [...] }
export const ARRAY_CONFIG_KEYS: readonly string[] = [
  'branches',
  'hostels',
  'quotes',
  'quickLinks',
  'forms',
  'directory',
  'courses',
  'students',
  'campusMap',
  'quickRoutes',
  'gradingScale',
];

/** The document data a config section is stored as */
export const toConfigDocData = <K extends keyof AdminConfig>(section: K, data: AdminConfig[K]) =>
  ARRAY_CONFIG_KEYS.includes(section) ? { items: data } : data;
