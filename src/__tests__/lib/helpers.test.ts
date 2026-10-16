import { describe, it, expect } from 'vitest';
import { getRandomItem } from '@lib/utils/helpers';

describe('helpers - getRandomItem', () => {
  it('returns an item from the array', () => {
    const items = ['a', 'b', 'c'];
    const result = getRandomItem(items);
    expect(items).toContain(result);
  });

  it('returns the only item from single-element array', () => {
    const items = ['only'];
    expect(getRandomItem(items)).toBe('only');
  });

  it('works with number arrays', () => {
    const items = [1, 2, 3, 4, 5];
    const result = getRandomItem(items);
    expect(items).toContain(result);
  });
});
