/**
 * Cost-optimization cache utilities
 * Reduces Firestore reads by caching frequently accessed data
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Memory cache for current session (cleared on page refresh)
const memoryCache = new Map<string, CacheEntry<unknown>>();

// Default TTLs in milliseconds
export const CACHE_TTL = {
  CONFIG: 5 * 60 * 1000, // 5 minutes for app config (shared across users)
  USER_DATA: 2 * 60 * 1000, // 2 minutes for user-specific data
  STATIC: 30 * 60 * 1000, // 30 minutes for static/rarely changing data
} as const;

/**
 * Check if a cache entry is still valid
 */
function isValid<T>(entry: CacheEntry<T> | undefined): entry is CacheEntry<T> {
  if (!entry) return false;
  return Date.now() - entry.timestamp < entry.ttl;
}

/**
 * Generic cache utility for reducing Firestore reads
 */
export const cache = {
  /**
   * Get cached data if valid, otherwise return null
   */
  get<T>(key: string): T | null {
    const entry = memoryCache.get(key) as CacheEntry<T> | undefined;
    if (isValid(entry)) {
      return entry.data;
    }
    // Clean up expired entry
    if (entry) {
      memoryCache.delete(key);
    }
    return null;
  },

  /**
   * Store data in cache with TTL
   */
  set<T>(key: string, data: T, ttl: number = CACHE_TTL.CONFIG): void {
    memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  },

  /**
   * Invalidate a specific cache entry
   */
  invalidate(key: string): void {
    memoryCache.delete(key);
  },

  /**
   * Invalidate all entries matching a prefix
   */
  invalidatePrefix(prefix: string): void {
    for (const key of memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        memoryCache.delete(key);
      }
    }
  },

  /**
   * Clear all cached data
   */
  clear(): void {
    memoryCache.clear();
  },

  /**
   * Get cache statistics for debugging
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: memoryCache.size,
      keys: Array.from(memoryCache.keys()),
    };
  },
};

// Cache key constants for consistent usage
export const CACHE_KEYS = {
  APP_CONFIG: 'appConfig',
  USER_PREFIX: 'user:',
} as const;
