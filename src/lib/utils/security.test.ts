import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { rateLimitCheck } from './security';

describe('Security Utilities', () => {
  describe('rateLimitCheck', () => {
    beforeEach(() => {
      // Clear sessionStorage before each test
      sessionStorage.clear();
      // Mock Date.now to control time
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should allow actions within the limit', () => {
      const key = 'test_action';
      const maxActions = 3;
      const windowMs = 60000;

      // First action
      expect(rateLimitCheck(key, maxActions, windowMs)).toBe(true);
      // Second action
      expect(rateLimitCheck(key, maxActions, windowMs)).toBe(true);
      // Third action
      expect(rateLimitCheck(key, maxActions, windowMs)).toBe(true);
    });

    it('should block actions exceeding the limit', () => {
      const key = 'test_limit';
      const maxActions = 2;
      const windowMs = 60000;

      expect(rateLimitCheck(key, maxActions, windowMs)).toBe(true);
      expect(rateLimitCheck(key, maxActions, windowMs)).toBe(true);
      // Third action should fail
      expect(rateLimitCheck(key, maxActions, windowMs)).toBe(false);
    });

    it('should reset limit after window expires', () => {
      const key = 'test_window';
      const maxActions = 1;
      const windowMs = 1000;

      expect(rateLimitCheck(key, maxActions, windowMs)).toBe(true);
      expect(rateLimitCheck(key, maxActions, windowMs)).toBe(false);

      // Advance time beyond window
      vi.advanceTimersByTime(1100);

      // Should be allowed again
      expect(rateLimitCheck(key, maxActions, windowMs)).toBe(true);
    });

    it('should handle different keys independently', () => {
      const key1 = 'action1';
      const key2 = 'action2';
      const maxActions = 1;

      expect(rateLimitCheck(key1, maxActions)).toBe(true);
      expect(rateLimitCheck(key1, maxActions)).toBe(false);

      // key2 should still be allowed
      expect(rateLimitCheck(key2, maxActions)).toBe(true);
    });
  });
});
