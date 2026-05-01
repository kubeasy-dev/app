import { Hono } from "hono";
import { requireAdmin } from "../../middleware/admin";
import type { AppEnv } from "../../middleware/session";
import { adminChallenges } from "./challenges";
import { adminUsers } from "./users";

export const admin = new Hono<AppEnv>()
  .use("/*", requireAdmin)
  .route("/challenges", adminChallenges)
  .route("/users", adminUsers);
