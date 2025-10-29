import { ComponentType, lazy } from 'react';

/**
 * Lazy load a component with automatic retry on chunk loading failure
 * This helps handle cases where chunks fail to load due to:
 * - Stale cache after deployment
 * - Network issues
 * - CDN problems
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retries = 3
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
    );

    try {
      const component = await componentImport();
      window.sessionStorage.setItem('page-has-been-force-refreshed', 'false');
      return component;
    } catch (error) {
      // If chunk loading fails and we haven't already force refreshed
      if (!pageHasAlreadyBeenForceRefreshed) {
        // Mark that we're force refreshing
        window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
        // Reload the page to get fresh chunks
        window.location.reload();
        // Return a dummy component (we won't get here due to reload)
        return { default: (() => null) as unknown as T };
      }

      // If we've already tried force refresh, attempt retries
      let lastError = error;
      for (let i = 0; i < retries; i++) {
        try {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
          const component = await componentImport();
          return component;
        } catch (retryError) {
          lastError = retryError;
          console.error(`Retry ${i + 1}/${retries} failed:`, retryError);
        }
      }

      // All retries failed, throw the error
      console.error('All chunk loading retries failed:', lastError);
      throw lastError;
    }
  });
}
