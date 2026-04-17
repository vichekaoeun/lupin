/**
 * Redis caching layer for due-card lists.
 *
 * Required env vars:
 *   REDIS_HOST   e.g. your-cluster.cache.amazonaws.com
 *   REDIS_PORT   defaults to 6379
 *   REDIS_TLS    set to 'true' for ElastiCache in-transit encryption
 *
 * Cache key: due:<userId>:<YYYY-MM-DD>, TTL 24 h.
 * Falls back gracefully when Redis is not configured.
 */

import Redis from 'ioredis';
import { Card } from './types';

const CACHE_TTL_SECONDS = 24 * 60 * 60;

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
    _redis.on('error', (err) => {
      console.warn('[Redis] connection error (continuing without cache):', err.message);
    });
  }
  return _redis;
}

function cacheKey(userId: string, date: string) {
  return `due:${userId}:${date}`;
}

/** Get cached due-card list. Returns null on cache miss or when Redis is unavailable. */
export async function getCachedDueCards(
  userId: string,
  date: string
): Promise<Card[] | null> {
  const client = getRedis();
  if (!client) return null;
  try {
    const raw = await client.get(cacheKey(userId, date));
    if (!raw) return null;
    return JSON.parse(raw) as Card[];
  } catch {
    return null;
  }
}

/** Store due-card list with 24 h TTL. Silently no-ops when Redis is unavailable. */
export async function cacheDueCards(
  userId: string,
  date: string,
  cards: Card[]
): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    await client.setex(cacheKey(userId, date), CACHE_TTL_SECONDS, JSON.stringify(cards));
  } catch {
    // non-fatal
  }
}

/** Invalidate the due-card cache for a user (e.g. after a review submission). */
export async function invalidateDueCards(userId: string, date: string): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    await client.del(cacheKey(userId, date));
  } catch {
    // Non-fatal
  }
}
