/**
 * Security Utilities
 */

/**
 * Validate URL safety.
 * Ensures URLs use safe protocols and don't contain javascript: or data: schemes.
 *
 * @param url - The URL to validate
 * @returns true if URL is safe
 */
export function validateUrl(url: string): boolean {
  if (typeof url !== 'string') {
    return false;
  }

  // Must start with http:// or https://
  const safeProtocolRegex = /^https?:\/\//i;
  if (!safeProtocolRegex.test(url)) {
    return false;
  }

  // Check for dangerous patterns
  const dangerousPatterns = [
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /on\w+=/i, // onclick=, onerror=, etc.
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(url)) {
      return false;
    }
  }

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Client-side rate limiting helper.
 * Tracks action counts in session storage to prevent abuse.
 *
 * @param actionKey - Unique key for the action being rate limited
 * @param maxActions - Maximum number of actions allowed
 * @param windowMs - Time window in milliseconds
 * @returns true if action is allowed, false if rate limited
 */
export function rateLimitCheck(
  actionKey: string,
  maxActions: number = 10,
  windowMs: number = 60000
): boolean {
  const storageKey = `rate_limit_${actionKey}`;
  const now = Date.now();

  try {
    const stored = sessionStorage.getItem(storageKey);
    let data: { timestamps: number[] } = { timestamps: [] };

    if (stored) {
      data = JSON.parse(stored);
    }

    // Filter out old timestamps outside the window
    data.timestamps = data.timestamps.filter((ts) => now - ts < windowMs);

    // Check if over limit
    if (data.timestamps.length >= maxActions) {
      return false;
    }

    // Add current timestamp and save
    data.timestamps.push(now);
    sessionStorage.setItem(storageKey, JSON.stringify(data));

    return true;
  } catch {
    // If session storage fails, allow the action
    return true;
  }
}
