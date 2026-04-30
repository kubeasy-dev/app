import { randomBytes } from "node:crypto";
import type { Redis } from "ioredis";
import { nanoid } from "nanoid";

export interface RunTokenRecord {
  userId: string;
  challengeSlug: string;
  nonce: string;
  startedAt: number;
  expiresAt: number;
}

const RUN_TOKEN_TTL_SECONDS = 60 * 60; // 1h
const ACTIVE_RUN_TTL_SECONDS = RUN_TOKEN_TTL_SECONDS;

const tokenKey = (token: string) => `run:${token}`;
const activeRunKey = (userId: string, slug: string) =>
  `run-active:${userId}:${slug}`;

export async function issueRunToken(
  redis: Redis,
  userId: string,
  challengeSlug: string,
): Promise<RunTokenRecord & { runToken: string }> {
  const runToken = nanoid(32);
  const nonce = randomBytes(32).toString("hex");
  const startedAt = Date.now();
  const expiresAt = startedAt + RUN_TOKEN_TTL_SECONDS * 1000;

  const record: RunTokenRecord = {
    userId,
    challengeSlug,
    nonce,
    startedAt,
    expiresAt,
  };

  // Replace any previous active run for this (user, slug) to enforce a
  // single live run per challenge.
  const existing = await redis.get(activeRunKey(userId, challengeSlug));
  if (existing) {
    await redis.del(tokenKey(existing));
  }

  const pipeline = redis.multi();
  pipeline.set(
    tokenKey(runToken),
    JSON.stringify(record),
    "EX",
    RUN_TOKEN_TTL_SECONDS,
  );
  pipeline.set(
    activeRunKey(userId, challengeSlug),
    runToken,
    "EX",
    ACTIVE_RUN_TTL_SECONDS,
  );
  await pipeline.exec();

  return { runToken, ...record };
}

export async function getRunToken(
  redis: Redis,
  runToken: string,
): Promise<RunTokenRecord | null> {
  const raw = await redis.get(tokenKey(runToken));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RunTokenRecord;
  } catch {
    return null;
  }
}

export async function revokeRunToken(
  redis: Redis,
  runToken: string,
  userId: string,
  challengeSlug: string,
): Promise<void> {
  const pipeline = redis.multi();
  pipeline.del(tokenKey(runToken));
  pipeline.del(activeRunKey(userId, challengeSlug));
  await pipeline.exec();
}
