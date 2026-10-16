import { readFileSync } from 'node:fs';

import { describe, expect, it, vi } from 'vitest';

type Listener = (event: unknown) => void;

/** Runs public/sw.js against stand-in worker globals and returns its fetch handler. */
const loadWorker = () => {
  const listeners: Record<string, Listener> = {};
  const self = {
    location: { origin: 'https://app.test' },
    addEventListener: (type: string, listener: Listener) => (listeners[type] = listener),
    clients: { claim: vi.fn(), matchAll: vi.fn(async () => []) },
    skipWaiting: vi.fn(),
  };
  const caches = {
    match: vi.fn(async () => undefined),
    open: vi.fn(async () => ({ put: vi.fn() })),
    keys: vi.fn(async () => []),
  };
  const fetch = vi.fn(async () => new Response('ok'));
  new Function('self', 'caches', 'fetch', readFileSync('public/sw.js', 'utf8'))(
    self,
    caches,
    fetch
  );
  const onFetch = listeners.fetch;
  if (!onFetch) throw new Error('sw.js registered no fetch handler');

  /** Whether the worker takes over the request instead of leaving it to the browser */
  const claims = (url: string, init?: RequestInit) => {
    const respondWith = vi.fn();
    onFetch({ request: new Request(url, init), respondWith });
    return respondWith.mock.calls.length > 0;
  };
  return { claims };
};

describe('service worker fetch handling', () => {
  it("leaves third-party scripts to the browser, where the page's script-src applies", () => {
    const { claims } = loadWorker();
    expect(claims('https://www.gstatic.com/recaptcha/releases/abc/recaptcha__en.js')).toBe(false);
  });

  it('leaves third-party API calls to the browser', () => {
    const { claims } = loadWorker();
    const gemini =
      'https://firebasevertexai.googleapis.com/v1beta/projects/p/models/m:generateContent';
    expect(claims(gemini, { method: 'POST', body: '{}' })).toBe(false);
  });

  it("still serves the app's own scripts", () => {
    const { claims } = loadWorker();
    expect(claims('https://app.test/assets/main-abc123.js')).toBe(true);
  });
});
