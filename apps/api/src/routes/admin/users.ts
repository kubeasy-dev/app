import { all } from "better-all";
import { count, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import { z } from "zod";
import { db } from "../../db";
import { user, userXp } from "../../db/schema";
import { sessionSecurity } from "../../lib/openapi-shared";
import type { AppEnv } from "../../middleware/session";

const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

const AdminUserItemSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string(),
  image: z.string().nullable(),
  role: z.string().nullable(),
  createdAt: z.coerce.date(),
  banned: z.boolean().nullable(),
  banReason: z.string().nullable(),
  totalXp: z.number(),
  completedChallenges: z.number(),
});

const AdminUsersOutputSchema = z.object({
  users: z.array(AdminUserItemSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

const AdminUsersStatsSchema = z.object({
  total: z.number(),
  active: z.number(),
  banned: z.number(),
  admins: z.number(),
});

export const adminUsers = new Hono<AppEnv>()
  .get(
    "/",
    describeRoute({
      tags: ["Admin"],
      summary: "Paginated user list",
      security: sessionSecurity,
      responses: {
        200: {
          description: "Users",
          content: {
            "application/json": { schema: resolver(AdminUsersOutputSchema) },
          },
        },
      },
    }),
    validator("query", PaginationSchema),
    async (c) => {
      const { page, limit } = c.req.valid("query");
      const offset = (page - 1) * limit;

      const { countRows, users } = await all({
        async countRows() {
          return db.select({ total: count(user.id) }).from(user);
        },
        async users() {
          return db
            .select({
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
              role: user.role,
              createdAt: user.createdAt,
              banned: user.banned,
              banReason: user.banReason,
              totalXp: sql<number>`COALESCE(${userXp.totalXp}, 0)`,
              completedChallenges: sql<number>`(
            SELECT COUNT(*) FROM user_progress
            WHERE user_progress.user_id = ${user.id}
            AND user_progress.status = 'completed'
          )`,
            })
            .from(user)
            .leftJoin(userXp, eq(user.id, userXp.userId))
            .orderBy(user.createdAt)
            .limit(limit)
            .offset(offset);
        },
      });
      const total = countRows[0]?.total ?? 0;

      return c.json({ users, total, page, limit });
    },
  )
  .get(
    "/stats",
    describeRoute({
      tags: ["Admin"],
      summary: "Aggregated user counts",
      security: sessionSecurity,
      responses: {
        200: {
          description: "Stats",
          content: {
            "application/json": { schema: resolver(AdminUsersStatsSchema) },
          },
        },
      },
    }),
    async (c) => {
      const [stats] = await db
        .select({
          total: count(user.id),
          banned: sql<number>`COUNT(CASE WHEN ${user.banned} = true THEN 1 END)`,
          admins: sql<number>`COUNT(CASE WHEN ${user.role} = 'admin' THEN 1 END)`,
        })
        .from(user);

      const total = stats?.total ?? 0;
      const banned = Number(stats?.banned ?? 0);
      const admins = Number(stats?.admins ?? 0);

      return c.json({
        total,
        active: total - banned,
        banned,
        admins,
      });
    },
  );
