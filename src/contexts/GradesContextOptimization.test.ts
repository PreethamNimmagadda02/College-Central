import { describe, it, expect } from 'vitest';

describe('GradesContext Optimization Benchmark', () => {
  const MAX_PASSES = 2;
  const DELAY_MS = 100;

  // Simulate the extraction function
  const performExtraction = async (pass: number) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ pass, result: 'success' });
      }, DELAY_MS);
    });
  };

  it('measures sequential execution time (Baseline)', async () => {
    const start = performance.now();
    const allPasses = [];

    // Current Code Logic
    for (let pass = 0; pass < MAX_PASSES; pass++) {
      try {
        const passResult = await performExtraction(pass);
        allPasses.push(passResult);
      } catch (passError) {
        console.warn(`[Extraction] Pass ${pass + 1} failed:`, passError);
      }
    }

    const end = performance.now();
    const duration = end - start;
    console.log(`Sequential execution took: ${duration.toFixed(2)}ms`);

    // Expect it to be roughly MAX_PASSES * DELAY_MS
    expect(duration).toBeGreaterThanOrEqual(MAX_PASSES * DELAY_MS);
  });

  it('measures parallel execution time (Optimized)', async () => {
    const start = performance.now();
    const allPasses: any[] = [];

    // Optimized Logic
    const promises = Array.from({ length: MAX_PASSES }, (_, pass) => performExtraction(pass));
    const results = await Promise.allSettled(promises);

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allPasses.push(result.value);
      } else {
        console.warn(`[Extraction] Pass ${index + 1} failed:`, result.reason);
      }
    });

    const end = performance.now();
    const duration = end - start;
    console.log(`Parallel execution took: ${duration.toFixed(2)}ms`);

    // Expect it to be roughly DELAY_MS (plus overhead)
    expect(duration).toBeGreaterThanOrEqual(DELAY_MS);
    expect(duration).toBeLessThan(MAX_PASSES * DELAY_MS);
  });
});
