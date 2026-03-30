import { asc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index";
import { challengeTheme } from "../db/schema/index";
import { cached, cacheKey, TTL } from "../lib/cache";

const themes = new Hono();

// GET /themes -- list all themes sorted by name
themes.get("/", async (c) => {
  const results = await cached(cacheKey("themes:list"), TTL.STATIC, () =>
    db.select().from(challengeTheme).orderBy(asc(challengeTheme.name)),
  );
  return c.json(results);
});

// GET /themes/:slug -- get a single theme by slug
themes.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const theme = await cached(
    cacheKey("themes:detail", { slug }),
    TTL.STATIC,
    async () => {
      const [row] = await db
        .select()
        .from(challengeTheme)
        .where(eq(challengeTheme.slug, slug))
        .limit(1);
      return row ?? null;
    },
  );
  if (!theme) {
    return c.json({ error: "Theme not found" }, 404);
  }
  return c.json(theme);
});

export { themes };
