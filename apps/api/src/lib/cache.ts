import { redis } from "./redis";

export const TTL = {
  STATIC: 3600, // 1 hour  — themes, types
  PUBLIC: 300, // 5 min   — challenge list, detail, objectives
  USER: 120, // 2 min   — xp, streak, progress, completion
} as const;

const PREFIX = "cache:";

/**
 * Build a deterministic cache key from a base name and optional params.
 * Params are sorted alphabetically to avoid key duplication from ordering.
 *
 * Examples:
 *   cacheKey("themes:list")                           → "cache:themes:list"
 *   cacheKey("themes:detail", { slug: "networking" }) → "cache:themes:detail:slug=networking"
 *   cacheKey("u:abc:challenges:list", { difficulty: "easy", theme: "networking" })
 *     → "cache:u:abc:challenges:list:difficulty=easy&theme=networking"
 */
export function cacheKey(
  base: string,
  params?: Record<string, string | number | boolean | null | undefined>,
): string {
  let key = `${PREFIX}${base}`;
  if (params) {
    const sorted = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("&");
    if (sorted) key += `:${sorted}`;
  }
  return key;
}

/** Get a cached value. Returns null on miss or parse error. */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const raw = await redis.get(key);
  if (!raw) return null;
  return JSON.parse(raw) as T;
}

/** Set a cached value with a mandatory TTL in seconds. */
export async function cacheSet(
  key: string,
  data: unknown,
  ttlSeconds: number,
): Promise<void> {
  await redis.set(key, JSON.stringify(data), "EX", ttlSeconds);
}

/** Delete a single cache key. */
export async function cacheDel(key: string): Promise<void> {
  await redis.del(key);
}

/**
 * Delete all keys matching a glob pattern using SCAN (non-blocking).
 * Example: cacheDelPattern("cache:u:abc123:*")
 */
export async function cacheDelPattern(pattern: string): Promise<void> {
  let cursor = "0";
  do {
    const [nextCursor, keys] = await redis.scan(
      cursor,
      "MATCH",
      pattern,
      "COUNT",
      100,
    );
    cursor = nextCursor;
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } while (cursor !== "0");
}

/**
 * Cache-or-fetch: check cache first, call fetchFn on miss, store result with TTL.
 *
 * Note: flow() from better-all cannot be used here — when $end() is called after
 * an await (async $end), the resolver for dependent tasks is never settled, causing
 * a permanent hang. Simple sequential logic is the correct approach.
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>,
): Promise<T> {
  const hit = await cacheGet<T>(key);
  if (hit !== null) return hit;
  const data = await fetchFn();
  await cacheSet(key, data, ttlSeconds);
  return data;
}
