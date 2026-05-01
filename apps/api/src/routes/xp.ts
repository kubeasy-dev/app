import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { describeRoute, resolver } from "hono-openapi";
import { z } from "zod";
import { db } from "../db/index";
import { userXpTransaction } from "../db/schema/index";
import { sessionSecurity } from "../lib/openapi-shared";
import { hydrateChallenges } from "../lib/registry";
import { type AppEnv, requireAuth } from "../middleware/session";

const XpHistoryItemSchema = z.object({
  id: z.string(),
  action: z.string(),
  xpAmount: z.number(),
  description: z.string().nullable(),
  createdAt: z.coerce.date(),
  challengeSlug: z.string().nullable(),
  challengeTitle: z.string().nullable(),
  challengeDifficulty: z.string().nullable(),
});

const XpHistoryOutputSchema = z.array(XpHistoryItemSchema);

export const xp = new Hono<AppEnv>().get(
  "/history",
  describeRoute({
    tags: ["User"],
    summary: "Last 20 XP transactions enriched with challenge details",
    security: sessionSecurity,
    responses: {
      200: {
        description: "XP history",
        content: {
          "application/json": { schema: resolver(XpHistoryOutputSchema) },
        },
      },
    },
  }),
  requireAuth,
  async (c) => {
    const user = c.get("user");
    const userId = user.id;

    const transactions = await db
      .select({
        id: userXpTransaction.id,
        action: userXpTransaction.action,
        xpAmount: userXpTransaction.xpAmount,
        description: userXpTransaction.description,
        createdAt: userXpTransaction.createdAt,
        challengeSlug: userXpTransaction.challengeSlug,
      })
      .from(userXpTransaction)
      .where(eq(userXpTransaction.userId, userId))
      .orderBy(desc(userXpTransaction.createdAt))
      .limit(20);

    const slugs = [
      ...new Set(
        transactions
          .map((t) => t.challengeSlug)
          .filter((s): s is string => s !== null),
      ),
    ];
    const challengeMap = await hydrateChallenges(slugs);

    const recentGains = transactions.map((t) => {
      const ch = t.challengeSlug ? challengeMap.get(t.challengeSlug) : null;
      return {
        id: t.id,
        action: t.action,
        xpAmount: t.xpAmount,
        description: t.description,
        createdAt: t.createdAt,
        challengeSlug: t.challengeSlug,
        challengeTitle: ch?.title ?? null,
        challengeDifficulty: ch?.difficulty ?? null,
      };
    });

    return c.json(recentGains);
  },
);
