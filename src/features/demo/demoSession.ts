// Guest demo mode: visitors without a college email explore the app with
// sample data kept in this browser. A guest never signs in to Firebase, so the
// security rules keep protecting real students' data.

/** Stand-in uid for the guest. Real Firebase uids are 28 random characters. */
export const DEMO_UID = 'demo-guest';
export const DEMO_EMAIL = 'guest@demo.local';
export const DEMO_DISPLAY_NAME = 'Aarav Mehta';

/** Shown wherever a guest tries to change their photo, which needs Firebase Storage. */
export const DEMO_PHOTO_UNAVAILABLE = "Profile pictures can't be changed in the demo.";

const SESSION_KEY = 'cc_demo_session';

// Keeps the demo alive in this tab when localStorage is blocked or full
let memoryFlag = false;

export const isDemoUid = (uid: string | null | undefined): boolean => uid === DEMO_UID;

export function isDemoActive(): boolean {
  if (memoryFlag) return true;
  try {
    return localStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function startDemo(): void {
  memoryFlag = true;
  try {
    localStorage.setItem(SESSION_KEY, '1');
  } catch {
    // Storage blocked or full: the in-memory flag covers this tab
  }
}

export function endDemo(): void {
  memoryFlag = false;
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // Storage blocked: nothing was persisted
  }
}
