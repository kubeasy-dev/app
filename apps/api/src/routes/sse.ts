import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { Redis } from "ioredis";
import type { AppEnv } from "../middleware/session.js";
import { requireAuth } from "../middleware/session.js";

const sse = new Hono<AppEnv>();

// GET /sse/validation/:challengeSlug -- real-time validation status push via SSE
sse.get("/validation/:challengeSlug", requireAuth, async (c) => {
  const user = c.get("user");
  const challengeSlug = c.req.param("challengeSlug");
  const channel = `validation:${user.id}:${challengeSlug}`;

  return streamSSE(c, async (stream) => {
    const subscriber = new Redis(
      process.env.REDIS_URL ?? "redis://localhost:6379",
    );
    let aborted = false;

    stream.onAbort(async () => {
      aborted = true;
      try {
        await subscriber.unsubscribe(channel);
        await subscriber.quit();
      } catch (err) {
        console.error("SSE cleanup error", { channel, error: String(err) });
      }
    });

    subscriber.on("message", async (_ch: string, message: string) => {
      await stream.writeSSE({
        data: message,
        event: "validation-update",
      });
    });

    await subscriber.subscribe(channel);

    // Heartbeat loop — keeps connection alive through proxies
    while (!aborted) {
      await stream.writeSSE({ data: "", event: "heartbeat" });
      await stream.sleep(30_000);
    }
  });
});

export { sse };
