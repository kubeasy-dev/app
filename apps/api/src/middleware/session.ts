import type { EvlogVariables } from "evlog/hono";
import { createMiddleware } from "hono/factory";
import { auth } from "../lib/auth";

export type SessionUser = typeof auth.$Infer.Session.user;
export type SessionData = typeof auth.$Infer.Session.session;

export type AppEnv = {
  Variables: {
    user: SessionUser | null;
    session: SessionData | null;
  } & EvlogVariables["Variables"];
};

export const sessionMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  c.set("user", session?.user ?? null);
  c.set("session", session?.session ?? null);
  await next();
});

export const requireAuth = createMiddleware<{
  Variables: {
    user: SessionUser;
    session: SessionData | null;
  } & EvlogVariables["Variables"];
}>(async (c, next) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
});
