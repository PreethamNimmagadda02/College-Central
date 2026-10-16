import { beforeEach, describe, expect, it, vi } from 'vitest';

const genai = vi.hoisted(() => ({ generateContent: vi.fn(), getModel: vi.fn() }));

vi.mock('@lib/firebase', () => ({
  getFirebaseAI: async () => ({ getModel: genai.getModel }),
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

const reply = (text: string) => ({ response: { text: () => text } });

describe('extractWithWorkflow', () => {
  beforeEach(() => {
    genai.generateContent.mockReset();
    genai.getModel.mockReset().mockReturnValue({ generateContent: genai.generateContent });
  });

  it('asks Gemini for JSON and parses the reply', async () => {
    genai.generateContent.mockResolvedValueOnce(reply('[{"name":"Convocation"}]'));

    const result = await extractWithWorkflow('Convocation: 12 Dec', config);

    expect(genai.getModel).toHaveBeenCalledWith({ responseMimeType: 'application/json' });
    expect(result.data).toEqual([{ name: 'Convocation' }]);
  });

  it('retries a chunk after a rate-limit error instead of dropping its events', async () => {
    genai.generateContent
      .mockRejectedValueOnce(new Error('got status: 429 Too Many Requests'))
      .mockResolvedValueOnce(reply('[{"name":"Mid-semester exams"}]'));

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
