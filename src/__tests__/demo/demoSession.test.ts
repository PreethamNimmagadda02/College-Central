import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEMO_UID, endDemo, isDemoActive, isDemoUid, startDemo } from '@features/demo/demoSession';

describe('demoSession', () => {
  beforeEach(() => {
    localStorage.clear();
    endDemo();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is inactive by default', () => {
    expect(isDemoActive()).toBe(false);
  });

  it('starts and ends the demo and remembers it across reloads', () => {
    startDemo();
    expect(isDemoActive()).toBe(true);
    expect(localStorage.getItem('cc_demo_session')).toBe('1');

    endDemo();
    expect(isDemoActive()).toBe(false);
    expect(localStorage.getItem('cc_demo_session')).toBeNull();
  });

  it('falls back to memory when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    startDemo();
    expect(isDemoActive()).toBe(true);
    endDemo();
    expect(isDemoActive()).toBe(false);
  });

  it('stays active in this tab when storage is full', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });

    startDemo();
    expect(isDemoActive()).toBe(true);
  });

  it('recognises only the demo uid', () => {
    expect(isDemoUid(DEMO_UID)).toBe(true);
    expect(isDemoUid('k3Jd9sQ0aPz8W1xYvB2nM4cR7tL5')).toBe(false);
    expect(isDemoUid(undefined)).toBe(false);
  });
});
