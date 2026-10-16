import { describe, expect, it } from 'vitest';

import { generateDefaultConfig } from '@config/defaultConfig';
import { CONFIG_DOCS, toConfigDocData } from '@services/configDocs';

describe('appConfig document layout', () => {
  it('gives every default config section a document, so seeding misses none', () => {
    expect(Object.keys(CONFIG_DOCS).sort()).toEqual(Object.keys(generateDefaultConfig()).sort());
  });

  it('wraps array sections in { items }, since a Firestore document cannot be an array', () => {
    const quotes = [{ id: 'q1', text: 'Keep going', author: 'Anon' }];
    expect(toConfigDocData('quotes', quotes)).toEqual({ items: quotes });
  });

  it('stores object sections as the document itself', () => {
    const { collegeInfo } = generateDefaultConfig();
    expect(toConfigDocData('collegeInfo', collegeInfo)).toBe(collegeInfo);
  });
});
