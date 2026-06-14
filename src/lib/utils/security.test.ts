import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rateLimitCheck } from './security';

describe('security utils', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.useFakeTimers();
  });

  describe('rateLimitCheck', () => {
    it('should allow actions within limit', () => {
      expect(rateLimitCheck('test_action', 2, 1000)).toBe(true);
      expect(rateLimitCheck('test_action', 2, 1000)).toBe(true);
    });

    it('should block actions exceeding limit', () => {
      expect(rateLimitCheck('test_action', 2, 1000)).toBe(true);
      expect(rateLimitCheck('test_action', 2, 1000)).toBe(true);
      expect(rateLimitCheck('test_action', 2, 1000)).toBe(false);
    });

    it('should reset after window expires', () => {
      expect(rateLimitCheck('test_action', 1, 1000)).toBe(true);
      expect(rateLimitCheck('test_action', 1, 1000)).toBe(false);

      vi.advanceTimersByTime(1001);

      expect(rateLimitCheck('test_action', 1, 1000)).toBe(true);
    });
  });
});
