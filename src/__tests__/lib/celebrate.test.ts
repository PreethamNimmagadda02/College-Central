import { celebrate } from '@lib/utils/celebrate';
import { describe, expect, it, vi } from 'vitest';

// vi.hoisted and vi.mock run before the imports above
const confetti = vi.hoisted(() => vi.fn(async () => undefined));
vi.mock('canvas-confetti', () => ({ default: confetti }));

describe('celebrate', () => {
  it('fires confetti that canvas-confetti skips for users who prefer reduced motion', async () => {
    await celebrate();

    expect(confetti).toHaveBeenCalledWith(
      expect.objectContaining({ disableForReducedMotion: true })
    );
  });
});
