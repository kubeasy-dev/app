import { logger } from "@kubeasy/logger";
import { createMiddleware } from "hono/factory";
import { env } from "../lib/env";
import { verifySubmitSignature } from "../lib/hmac";
import { redis } from "../lib/redis";
import { getRunToken, type RunTokenRecord } from "../lib/run-token";
import type { SessionData, SessionUser } from "./session";

const RUN_TOKEN_HEADER = "X-Kubeasy-Run-Token";
const SIGNATURE_HEADER = "X-Kubeasy-Signature";
const TIMESTAMP_HEADER = "X-Kubeasy-Timestamp";

const MAX_TIMESTAMP_SKEW_MS = 5 * 60 * 1000; // 5 min

export type SubmitGuardEnv = {
  Variables: {
    user: SessionUser | null;
    session: SessionData | null;
    runToken: string;
    runTokenRecord: RunTokenRecord;
    rawBody: string;
  };
};

/**
 * Validates that a submit request:
 *  - carries a valid X-Kubeasy-Run-Token tied to (user, slug)
 *  - carries an HMAC X-Kubeasy-Signature over the raw body computed with
 *    the per-run nonce returned by /start
 *  - is recent (X-Kubeasy-Timestamp within ±5 min)
 *
 * Stores the parsed run record + raw body on the context so the handler
 * can do its own JSON.parse + Zod validation.
 */
export const submitGuard = createMiddleware<SubmitGuardEnv>(async (c, next) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const slug = c.req.param("slug");
  if (!slug) {
    return c.json({ error: "Missing challenge slug" }, 400);
  }

  const runToken = c.req.header(RUN_TOKEN_HEADER);
  const signature = c.req.header(SIGNATURE_HEADER);
  const timestamp = c.req.header(TIMESTAMP_HEADER);

  // Read raw body once. Hono caches it on c.req.raw, but `c.req.json()` later
  // may double-parse — so the handler will JSON.parse(rawBody) instead.
  let rawBody: string;
  try {
    rawBody = await c.req.text();
  } catch (err) {
    logger.warn("[submit-guard] failed to read body", { error: String(err) });
    return c.json({ error: "Invalid request body" }, 400);
  }

  if (!runToken || !signature || !timestamp) {
    if (env.SUBMIT_HARDENED) {
      return c.json(
        {
          error: "Missing security headers",
          detail: `${RUN_TOKEN_HEADER}, ${SIGNATURE_HEADER}, ${TIMESTAMP_HEADER} are required.`,
        },
        400,
      );
    }
    logger.warn("[submit-guard] missing headers", {
      hasToken: !!runToken,
      hasSignature: !!signature,
      hasTimestamp: !!timestamp,
      hardened: false,
    });
    c.set("rawBody", rawBody);
    await next();
    return;
  }

  // Reject ridiculous timestamps to limit replay window
  const tsMs = Number(timestamp);
  if (!Number.isFinite(tsMs)) {
    return c.json({ error: "Invalid timestamp" }, 400);
  }
  const skew = Math.abs(Date.now() - tsMs);
  if (skew > MAX_TIMESTAMP_SKEW_MS) {
    return c.json({ error: "Timestamp out of acceptable range" }, 400);
  }

  const record = await getRunToken(redis, runToken);
  if (!record) {
    return c.json({ error: "Run token expired or unknown" }, 401);
  }

  if (record.userId !== user.id || record.challengeSlug !== slug) {
    return c.json({ error: "Run token does not match this submission" }, 403);
  }

  if (tsMs < record.startedAt) {
    return c.json({ error: "Timestamp predates run start" }, 400);
  }

  const ok = verifySubmitSignature(
    record.nonce,
    runToken,
    timestamp,
    rawBody,
    signature,
  );
  if (!ok) {
    if (env.SUBMIT_HARDENED) {
      return c.json({ error: "Invalid signature" }, 401);
    }
    logger.warn("[submit-guard] bad signature", { hardened: false });
  }

  c.set("runToken", runToken);
  c.set("runTokenRecord", record);
  c.set("rawBody", rawBody);
  await next();
});
