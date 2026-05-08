/**
 * In-process sliding-window rate limiter.
 * Suitable for single-instance deployments; for multi-instance (Vercel edge scale-out),
 * swap the Map for a Redis/Upstash KV store.
 */

type Window = { count: number; resetAt: number };

const store = new Map<string, Window>();

// Prune stale entries periodically to prevent unbounded memory growth
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, win] of store) {
      if (win.resetAt < now) store.delete(key);
    }
  }, 60_000);
}

/**
 * Check and increment the rate limit counter for a given key.
 * Returns { allowed: true } or { allowed: false, retryAfter: seconds }.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: true } | { allowed: false; retryAfter: number } {
  const now = Date.now();
  const win = store.get(key);

  if (!win || win.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (win.count >= limit) {
    return { allowed: false, retryAfter: Math.ceil((win.resetAt - now) / 1000) };
  }

  win.count += 1;
  return { allowed: true };
}

/** Helper: extract a stable identifier from an authenticated user or IP fallback. */
export function rateLimitKey(prefix: string, userId: string, suffix?: string): string {
  return suffix ? `${prefix}:${userId}:${suffix}` : `${prefix}:${userId}`;
}
