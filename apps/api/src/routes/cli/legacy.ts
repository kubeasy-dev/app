import { Hono } from "hono";
import type { AppEnv } from "../../middleware/session";
import { challenges } from "../challenges";
import { progress } from "../progress";
import { submit } from "../submit";

/**
 * Legacy CLI route aliases — maps old singular /challenge/:slug/* paths
 * to the current handlers without duplicating any logic.
 *
 * Old CLI paths → current handler
 *   GET  /challenge/:slug          → challenges GET /:slug (detail)
 *   GET  /challenge/:slug/status   → progress GET /:slug/status (alias)
 *   POST /challenge/:slug/start    → progress POST /:slug/start
 *   POST /challenge/:slug/reset    → progress POST /:slug/reset
 *   POST /challenge/:slug/submit   → submit POST /:slug/submit
 *
 * Mount order matters: challenges first so its GET /:slug (detail) wins
 * over progress's GET /:slug (status) for the bare slug path.
 */
export const legacyCli = new Hono()
  .route("/", challenges)
  .route("/", progress)
  .route("/", submit);
