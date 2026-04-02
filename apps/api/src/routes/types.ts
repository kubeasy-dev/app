import { asc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index";
import { challengeType } from "../db/schema/index";
import { cached, cacheKey, TTL } from "../lib/cache";

const types = new Hono();

// GET /types -- list all challenge types sorted by name
types.get("/", async (c) => {
  const results = await cached(cacheKey("types:list"), TTL.STATIC, () =>
    db.select().from(challengeType).orderBy(asc(challengeType.name)),
  );
  return c.json(results);
});

// GET /types/:slug -- get a single challenge type by slug
types.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const type = await cached(
    cacheKey("types:detail", { slug }),
    TTL.STATIC,
    async () => {
      const [row] = await db
        .select()
        .from(challengeType)
        .where(eq(challengeType.slug, slug))
        .limit(1);
      return row ?? null;
    },
  );
  if (!type) {
    return c.json({ error: "Type not found" }, 404);
  }
  return c.json(type);
});

export { types };
