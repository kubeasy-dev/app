import { all } from "better-all";
import { count, sql } from "drizzle-orm";
import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import { z } from "zod";
import { db } from "../../db";
import {
  challengeMetadata,
  userProgress,
  userSubmission,
} from "../../db/schema";
import { cacheDelPattern } from "../../lib/cache";
import { sessionSecurity } from "../../lib/openapi-shared";
import { getMeta, listChallenges } from "../../lib/registry";
import type { AppEnv } from "../../middleware/session";

const slugParam = z.object({ slug: z.string() });

const AdminChallengeItemSchema = z.object({
  slug: z.string(),
  title: z.string(),
  difficulty: z.string(),
  theme: z.string(),
  type: z.string(),
  available: z.boolean(),
  ofTheWeek: z.boolean(),
  starts: z.number(),
  completions: z.number(),
  totalSubmissions: z.number(),
  successfulSubmissions: z.number(),
});

const AdminChallengeListOutputSchema = z.object({
  challenges: z.array(AdminChallengeItemSchema),
});

const AdminChallengeStatsSchema = z.object({
  totalSubmissions: z.number(),
  successfulSubmissions: z.number(),
  successRate: z.number(),
  totalStarts: z.number(),
  totalCompletions: z.number(),
  completionRate: z.number(),
});

export const adminChallenges = new Hono<AppEnv>()
  .get(
    "/",
    describeRoute({
      tags: ["Admin"],
      summary: "List all challenges with metrics",
      security: sessionSecurity,
      responses: {
        200: {
          description: "Challenges",
          content: {
            "application/json": {
              schema: resolver(AdminChallengeListOutputSchema),
            },
          },
        },
      },
    }),
    async (c) => {
      const [registryList, meta, metadataRows, progressStats, submissionStats] =
        await Promise.all([
          listChallenges(),
          getMeta(),
          db.select().from(challengeMetadata),
          db
            .select({
              challengeSlug: userProgress.challengeSlug,
              starts: sql<number>`COUNT(DISTINCT CASE WHEN ${userProgress.status} != 'not_started' THEN ${userProgress.userId} END)`,
              completions: sql<number>`COUNT(DISTINCT CASE WHEN ${userProgress.status} = 'completed' THEN ${userProgress.userId} END)`,
            })
            .from(userProgress)
            .groupBy(userProgress.challengeSlug),
          db
            .select({
              challengeSlug: userSubmission.challengeSlug,
              totalSubmissions: count(userSubmission.id),
              successfulSubmissions: sql<number>`SUM(CASE WHEN ${userSubmission.validated} = true THEN 1 ELSE 0 END)`,
            })
            .from(userSubmission)
            .groupBy(userSubmission.challengeSlug),
        ]);

      const themeMap = new Map(meta.themes.map((t) => [t.slug, t]));
      const typeMap = new Map(meta.types.map((t) => [t.slug, t]));
      const metadataMap = new Map(metadataRows.map((m) => [m.slug, m]));
      const progressMap = new Map(
        progressStats.map((r) => [r.challengeSlug, r]),
      );
      const submissionMap = new Map(
        submissionStats.map((r) => [r.challengeSlug, r]),
      );

      const challenges = registryList.map((ch) => {
        const m = metadataMap.get(ch.slug);
        const p = progressMap.get(ch.slug);
        const s = submissionMap.get(ch.slug);
        return {
          slug: ch.slug,
          title: ch.title,
          difficulty: ch.difficulty,
          theme: themeMap.get(ch.theme)?.name ?? ch.theme,
          type: typeMap.get(ch.type)?.name ?? ch.type,
          available: m?.available ?? true,
          ofTheWeek: m?.ofTheWeek ?? false,
          starts: Number(p?.starts ?? 0),
          completions: Number(p?.completions ?? 0),
          totalSubmissions: Number(s?.totalSubmissions ?? 0),
          successfulSubmissions: Number(s?.successfulSubmissions ?? 0),
        };
      });

      return c.json({ challenges });
    },
  )
  .get(
    "/stats",
    describeRoute({
      tags: ["Admin"],
      summary: "Global challenge stats",
      security: sessionSecurity,
      responses: {
        200: {
          description: "Stats",
          content: {
            "application/json": { schema: resolver(AdminChallengeStatsSchema) },
          },
        },
      },
    }),
    async (c) => {
      const { submissionRows, progressRows } = await all({
        async submissionRows() {
          return db
            .select({
              totalSubmissions: count(userSubmission.id),
              successfulSubmissions: sql<number>`SUM(CASE WHEN ${userSubmission.validated} = true THEN 1 ELSE 0 END)`,
            })
            .from(userSubmission);
        },
        async progressRows() {
          return db
            .select({
              totalStarts: sql<number>`COUNT(DISTINCT CASE WHEN ${userProgress.status} != 'not_started' THEN ${userProgress.id} END)`,
              totalCompletions: sql<number>`COUNT(DISTINCT CASE WHEN ${userProgress.status} = 'completed' THEN ${userProgress.id} END)`,
            })
            .from(userProgress);
        },
      });
      const [submissionStats] = submissionRows;
      const [progressStats] = progressRows;

      const totalSubs = submissionStats?.totalSubmissions ?? 0;
      const successfulSubs = Number(
        submissionStats?.successfulSubmissions ?? 0,
      );
      const totalStarts = Number(progressStats?.totalStarts ?? 0);
      const totalCompletions = Number(progressStats?.totalCompletions ?? 0);

      return c.json({
        totalSubmissions: totalSubs,
        successfulSubmissions: successfulSubs,
        successRate: totalSubs > 0 ? successfulSubs / totalSubs : 0,
        totalStarts,
        totalCompletions,
        completionRate: totalStarts > 0 ? totalCompletions / totalStarts : 0,
      });
    },
  )
  .patch(
    "/:slug/available",
    describeRoute({
      tags: ["Admin"],
      summary: "Toggle challenge availability",
      security: sessionSecurity,
      responses: {
        200: { description: "Updated" },
      },
    }),
    validator("param", slugParam),
    validator("json", z.object({ available: z.boolean() })),
    async (c) => {
      const { slug } = c.req.valid("param");
      const { available } = c.req.valid("json");
      await db
        .insert(challengeMetadata)
        .values({ slug, available })
        .onConflictDoUpdate({
          target: challengeMetadata.slug,
          set: { available },
        });

      Promise.all([
        cacheDelPattern(`cache:challenges:detail:*${slug}*`),
        cacheDelPattern(`cache:challenges:objectives:*${slug}*`),
        cacheDelPattern("cache:u:*:challenges:list:*"),
      ]).catch((err) => {
        c.get("log").error("cache invalidation failed", {
          slug,
          error: String(err),
        });
      });

      return c.json({ success: true });
    },
  );
