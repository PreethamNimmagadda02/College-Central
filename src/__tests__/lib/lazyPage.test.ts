import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { reloadForNewBuild } from '@lib/utils/lazyPage';

const reload = vi.fn();
const originalLocation = window.location;
const chunkError = new Error('Failed to fetch dynamically imported module');

describe('reloadForNewBuild', () => {
  beforeEach(() => {
    sessionStorage.clear();
    reload.mockReset();
    Object.defineProperty(window, 'location', { configurable: true, value: { reload } });
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
    vi.restoreAllMocks();
  });

  it('reloads once to pick up a new build, and still rethrows', () => {
    expect(() => reloadForNewBuild(chunkError)).toThrow(chunkError);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('does not reload again within 30 seconds, so a broken deploy cannot loop', () => {
    expect(() => reloadForNewBuild(chunkError)).toThrow();
    expect(() => reloadForNewBuild(chunkError)).toThrow();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('does not reload while offline, so in-progress work is kept', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    expect(() => reloadForNewBuild(chunkError)).toThrow(chunkError);
    expect(reload).not.toHaveBeenCalled();
  });
});
