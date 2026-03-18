import { Hono } from "hono";
import { challenges } from "./challenges.js";
import { submissions } from "./submissions.js";
import { themes } from "./themes.js";
import { types } from "./types.js";
import { xp } from "./xp.js";

const routes = new Hono();

// Health check
routes.get("/health", (c) => c.json({ status: "ok" }));

// Mount route groups
routes.route("/challenges", challenges);
routes.route("/themes", themes);
routes.route("/types", types);
routes.route("/submissions", submissions);
routes.route("/xp", xp);

export { routes };
