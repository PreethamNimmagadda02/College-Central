import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const genai = vi.hoisted(() => ({ generateContent: vi.fn() }));

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent: genai.generateContent };
  },
}));

import { extractWithWorkflow, type ExtractionConfig } from '@services/aiExtractionWorkflow';

const config: ExtractionConfig<{ name: string }> = {
  schema: { name: 'events', description: 'Calendar events', fields: [], examples: '[]' },
  validate: (item): item is { name: string } =>
    typeof (item as { name?: unknown }).name === 'string',
  normalize: (item) => item,
  getDedupeKey: (item) => item.name,
  maxChunkSize: 10_000,
  chunkOverlap: 0,
  maxRetries: 3,
};

describe('extractWithWorkflow', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key');
    genai.generateContent.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('retries a chunk after a rate-limit error instead of dropping its events', async () => {
    genai.generateContent
      .mockRejectedValueOnce(new Error('got status: 429 Too Many Requests'))
      .mockResolvedValueOnce({ text: '[{"name":"Mid-semester exams"}]' });

    const result = await extractWithWorkflow('Mid-semester exams: 1-5 Sept', config);

    expect(genai.generateContent).toHaveBeenCalledTimes(2);
    expect(result.data).toEqual([{ name: 'Mid-semester exams' }]);
    expect(result.stats.failedChunks).toBe(0);
  });

  it('gives up on a chunk after maxRetries attempts', async () => {
    genai.generateContent.mockRejectedValue(new Error('got status: 503 Service Unavailable'));

    const result = await extractWithWorkflow('Mid-semester exams: 1-5 Sept', config);

    expect(genai.generateContent).toHaveBeenCalledTimes(3);
    expect(result.stats.failedChunks).toBe(1);
    expect(result.errors[0]).toContain('503');
  });
});
