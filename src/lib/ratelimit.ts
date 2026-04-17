/**
 * Lightweight rate limiter — uses Redis (fixed window) when available,
 * falls back to an in-process Map when Redis is not configured (local dev).
 *
 * Usage:
 *   const { allowed, remaining } = await rateLimit('ip:1.2.3.4:login', 10, 60 * 15);
 *   if (!allowed) return new Response('Too Many Requests', { status: 429 });
 */

import Redis from 'ioredis';

// ── Redis (reuse the existing connection logic) ───────────────────────────────

let _redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!process.env.REDIS_HOST) return null;
  if (!_redis) {
    _redis = new Redis({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT ?? 6379),
      tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
    _redis.on('error', (err) =>
      console.warn('[RateLimit/Redis] error (falling back to memory):', err.message)
    );
  }
  return _redis;
}

// ── In-memory fallback ────────────────────────────────────────────────────────

interface Window { count: number; reset: number }
const memStore = new Map<string, Window>();

function memRateLimit(key: string, limit: number, windowSecs: number) {
  const now = Date.now();
  let w = memStore.get(key);
  if (!w || now > w.reset) {
    w = { count: 0, reset: now + windowSecs * 1000 };
    memStore.set(key, w);
  }
  w.count++;
  return { allowed: w.count <= limit, remaining: Math.max(0, limit - w.count) };
}

// Prevent unbounded growth in long-running dev servers
setInterval(() => {
  const now = Date.now();
  for (const [k, w] of memStore) if (now > w.reset) memStore.delete(k);
}, 60_000);

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * @param key        Unique rate-limit bucket (e.g. `tts:userId`, `login:ip`)
 * @param limit      Max requests allowed in the window
 * @param windowSecs Window size in seconds
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSecs: number
): Promise<{ allowed: boolean; remaining: number }> {
  const redis = getRedis();

  if (!redis) {
    return memRateLimit(key, limit, windowSecs);
  }

  try {
    const rl = `rl:${key}`;
    const count = await redis.incr(rl);
    if (count === 1) await redis.expire(rl, windowSecs);
    return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
  } catch {
    // Redis hiccup — fail open so a Redis blip doesn't lock users out
    return memRateLimit(key, limit, windowSecs);
  }
}

/** Convenience: build a 429 response with Retry-After header. */
export function tooManyRequests(windowSecs: number) {
  return Response.json(
    { error: 'Too many requests — slow down.' },
    { status: 429, headers: { 'Retry-After': String(windowSecs) } }
  );
}
