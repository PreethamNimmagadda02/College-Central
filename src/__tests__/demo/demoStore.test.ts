import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEMO_STATE_VERSION } from '@features/demo/demoData';
import { DEMO_UID } from '@features/demo/demoSession';
import {
  addDemoActivity,
  getDemoState,
  getDemoUserByAdmissionNumber,
  getDemoUserById,
  resetDemoState,
  resetDemoStoreForTests,
  subscribeDemoState,
  updateDemoProfile,
  updateDemoState,
} from '@features/demo/demoStore';

const STORE_KEY = 'cc_demo_store';

describe('demoStore', () => {
  beforeEach(() => {
    localStorage.clear();
    resetDemoStoreForTests();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('seeds on first read and persists the seed', () => {
    expect(getDemoState().profile.id).toBe(DEMO_UID);
    expect(JSON.parse(localStorage.getItem(STORE_KEY)!).version).toBe(DEMO_STATE_VERSION);
  });

  it('restores saved changes after a reload', () => {
    updateDemoProfile({ bio: 'Changed in the demo' });
    resetDemoStoreForTests(); // a reload: memory is gone, storage remains
    expect(getDemoState().profile.bio).toBe('Changed in the demo');
  });

  it('reseeds when stored state is corrupt', () => {
    localStorage.setItem(STORE_KEY, '{not json');
    expect(getDemoState().profile.id).toBe(DEMO_UID);
  });

  it('reseeds when stored state comes from another version', () => {
    localStorage.setItem(
      STORE_KEY,
      JSON.stringify({ version: DEMO_STATE_VERSION - 1, profile: { name: 'Stale' } })
    );
    expect(getDemoState().profile.name).toBe('Aarav Mehta');
  });

  it('notifies subscribers immediately and on every change', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeDemoState(listener);
    expect(listener).toHaveBeenCalledTimes(1);

    updateDemoState((s) => ({ ...s, reminderEventKeys: [] }));
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener.mock.calls[1]![0].reminderEventKeys).toEqual([]);

    unsubscribe();
    updateDemoProfile({ bio: 'x' });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('keeps untouched slices referentially stable', () => {
    const before = getDemoState();
    const after = updateDemoProfile({ bio: 'x' });
    expect(after.notifications).toBe(before.notifications);
    expect(after.profile).not.toBe(before.profile);
  });

  it('adds activity newest first, with unique ids, capped at 30', () => {
    for (let i = 0; i < 40; i++) {
      addDemoActivity({ type: 'update', title: `Entry ${i}`, description: '', icon: '✏️' });
    }
    const { activity } = getDemoState();
    expect(activity).toHaveLength(30);
    expect(activity[0]!.title).toBe('Entry 39');
    expect(new Set(activity.map((a) => a.id)).size).toBe(30);
  });

  it('reset discards changes and notifies subscribers', () => {
    updateDemoProfile({ bio: 'Changed' });
    const listener = vi.fn();
    subscribeDemoState(listener);

    resetDemoState();
    expect(getDemoState().profile.bio).not.toBe('Changed');
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('keeps working in memory when storage is full', () => {
    getDemoState();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });

    expect(() => updateDemoProfile({ bio: 'Still works' })).not.toThrow();
    expect(getDemoState().profile.bio).toBe('Still works');
  });

  it('works without any storage at all', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(getDemoState().profile.id).toBe(DEMO_UID);
  });

  it('adopts changes made in another tab', () => {
    const listener = vi.fn();
    subscribeDemoState(listener);

    const otherTab = { ...getDemoState(), reminderEventKeys: ['from-other-tab'] };
    localStorage.setItem(STORE_KEY, JSON.stringify(otherTab));
    window.dispatchEvent(new StorageEvent('storage', { key: STORE_KEY }));

    expect(getDemoState().reminderEventKeys).toEqual(['from-other-tab']);
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ reminderEventKeys: ['from-other-tab'] })
    );
  });

  it('finds the guest and classmates by id or admission number', () => {
    const { classmates } = getDemoState();
    expect(getDemoUserById(DEMO_UID)?.name).toBe('Aarav Mehta');
    expect(getDemoUserByAdmissionNumber(classmates[0]!.admissionNumber)?.id).toBe(
      classmates[0]!.id
    );
    expect(getDemoUserById('k3Jd9sQ0aPz8W1xYvB2nM4cR7tL5')).toBeUndefined();
  });
});
