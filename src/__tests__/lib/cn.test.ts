import { describe, expect, it } from 'vitest';

import { cn } from '@lib/utils/cn';

describe('cn', () => {
  it('lets a later Tailwind class override a conflicting earlier one', () => {
    expect(cn('px-2 text-sm', 'px-4')).toBe('text-sm px-4');
  });

  it('drops falsy conditional classes', () => {
    const active = false;
    expect(cn('rounded', active && 'ring-2', undefined)).toBe('rounded');
  });
});
