import { lazy, type ComponentType } from 'react';

const RELOAD_KEY = 'chunk-reload-at';

/**
 * After a deploy, an open tab can ask for page chunks that no longer exist: reload once to get
 * the new build. Offline, or within 30s of that reload, rethrow so the error boundary shows
 * instead of looping or throwing away the user's work.
 */
export function reloadForNewBuild(error: unknown): never {
  try {
    const lastReload = Number(sessionStorage.getItem(RELOAD_KEY));
    if (navigator.onLine && Date.now() - lastReload > 30_000) {
      sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
      window.location.reload();
    }
  } catch {
    // Storage blocked: skip the reload rather than risk a loop
  }
  throw error;
}

/** React.lazy for route pages; other dynamic imports keep failing normally. */
export function lazyPage<T extends ComponentType<any>>(load: () => Promise<{ default: T }>) {
  return lazy(() => load().catch(reloadForNewBuild));
}
