import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { describeRoute } from "hono-openapi";
import { Redis } from "ioredis";
import { sessionSecurity } from "../lib/openapi-shared";
import { redisConfig } from "../lib/redis";
import { type AppEnv, requireAuth } from "../middleware/session";

export const sse = new Hono<AppEnv>().get(
  "/invalidate-cache",
  describeRoute({
    tags: ["SSE"],
    summary: "Generic cache-invalidation SSE channel",
    security: sessionSecurity,
    responses: {
      200: {
        description: "SSE stream",
        content: { "text/event-stream": { schema: { type: "string" } } },
      },
    },
  }),
  requireAuth,
  async (c) => {
    const user = c.get("user");
    const channel = `invalidate-cache:${user.id}`;

    return streamSSE(c, async (stream) => {
      const subscriber = new Redis(redisConfig);
      let aborted = false;

      stream.onAbort(async () => {
        aborted = true;
        try {
          await subscriber.unsubscribe(channel);
          await subscriber.quit();
        } catch (err) {
          c.get("log").error("SSE cleanup error", {
            channel,
            error: String(err),
          });
        }
      });

      subscriber.on("message", async (_ch: string, message: string) => {
        await stream.writeSSE({
          data: message,
          event: "invalidate-cache",
        });
      });

      await subscriber.subscribe(channel);

      while (!aborted) {
        await stream.writeSSE({ data: "", event: "heartbeat" });
        await stream.sleep(30_000);
      }
    });
  },
);
