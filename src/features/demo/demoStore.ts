// The guest's data, kept in this browser. It plays the part Firestore plays for
// real students: providers subscribe to it and write to it.

import { MAX_ACTIVITIES_STORED } from '@lib/utils/constants';

import { createDemoSeed, DEMO_STATE_VERSION } from './demoData';
import type { DemoProfile, DemoState } from './types';

import type { ActivityItem, User } from '@/types';

const STORE_KEY = 'cc_demo_store';

type Listener = (state: DemoState) => void;

let state: DemoState | null = null;
const listeners = new Set<Listener>();
let activitySequence = 0;

function readStored(): DemoState | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoState;
    return parsed?.version === DEMO_STATE_VERSION ? parsed : null;
  } catch {
    // Blocked storage or corrupt JSON: the caller reseeds
    return null;
  }
}

function persist(next: DemoState): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked: the demo keeps working from memory in this tab
  }
}

function publish(next: DemoState): DemoState {
  state = next;
  persist(next);
  listeners.forEach((listener) => listener(next));
  return next;
}

export function getDemoState(): DemoState {
  if (!state) {
    const stored = readStored();
    if (stored) {
      state = stored;
    } else {
      state = createDemoSeed(new Date());
      persist(state);
    }
  }
  return state;
}

export function updateDemoState(update: (current: DemoState) => DemoState): DemoState {
  return publish(update(getDemoState()));
}

export function updateDemoProfile(patch: Partial<DemoProfile>): DemoState {
  return updateDemoState((current) => ({ ...current, profile: { ...current.profile, ...patch } }));
}

export function addDemoActivity(entry: Omit<ActivityItem, 'id' | 'timestamp'>): DemoState {
  const nowMs = Date.now();
  activitySequence += 1;
  const item: ActivityItem = {
    ...entry,
    id: `demo-activity-${nowMs}-${activitySequence}`,
    timestamp: { seconds: Math.floor(nowMs / 1000), nanoseconds: 0 },
  };
  return updateDemoState((current) => ({
    ...current,
    activity: [item, ...current.activity].slice(0, MAX_ACTIVITIES_STORED),
  }));
}

export function resetDemoState(): DemoState {
  return publish(createDemoSeed(new Date()));
}

/** Calls the listener now and after every change, like Firestore's onSnapshot. */
export function subscribeDemoState(listener: Listener): () => void {
  listeners.add(listener);
  listener(getDemoState());
  return () => {
    listeners.delete(listener);
  };
}

export function getDemoUserById(id: string): User | undefined {
  const { profile, classmates } = getDemoState();
  return [profile, ...classmates].find((u) => u.id === id);
}

export function getDemoUserByAdmissionNumber(admissionNumber: string): User | undefined {
  const { profile, classmates } = getDemoState();
  return [profile, ...classmates].find((u) => u.admissionNumber === admissionNumber);
}

// Another tab changed the demo: adopt its state so the tabs don't overwrite each other
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORE_KEY) return;
    const next = readStored();
    if (!next) return;
    state = next;
    listeners.forEach((listener) => listener(next));
  });
}

/** Forgets in-memory state and listeners, as a page reload would. Tests only. */
export function resetDemoStoreForTests(): void {
  state = null;
  listeners.clear();
}
