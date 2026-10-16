import type {
  ActivityItem,
  CalendarEvent,
  Notification,
  StudentDirectoryEntry,
  User,
  UserFormsData,
} from '@/types';

/** The guest's users/{uid} document. */
export type DemoProfile = User;

export interface DemoState {
  /** DEMO_STATE_VERSION at seeding time; a stored state with another version is reseeded. */
  version: number;
  seededAt: number;
  profile: DemoProfile;
  userForms: UserFormsData;
  userEvents: CalendarEvent[];
  reminderEventKeys: string[];
  notifications: Notification[];
  activity: ActivityItem[];
  /** Classmates with a full public profile, reachable at /u/:id */
  classmates: User[];
  /** The Directory's Students tab: the guest plus fictional classmates */
  directory: StudentDirectoryEntry[];
}
