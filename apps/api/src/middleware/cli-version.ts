import { logger } from "@kubeasy/logger";
import { createMiddleware } from "hono/factory";
import { env } from "../lib/env";
import { isAtLeast } from "../lib/semver";

const HEADER = "X-Kubeasy-CLI-Version";

export const cliVersionMiddleware = createMiddleware(async (c, next) => {
  const version = c.req.header(HEADER);

  if (!version) {
    if (env.SUBMIT_HARDENED) {
      return c.json(
        {
          error: "Missing CLI version",
          detail: `Header ${HEADER} is required.`,
        },
        400,
      );
    }
    logger.warn("[cli-version] missing header", { hardened: false });
    await next();
    return;
  }

  if (!isAtLeast(version, env.MIN_CLI_VERSION)) {
    if (env.SUBMIT_HARDENED) {
      return c.json(
        {
          error: "Outdated CLI",
          detail: `Minimum required CLI version is ${env.MIN_CLI_VERSION}, got ${version}. Please run 'kubeasy upgrade'.`,
          minVersion: env.MIN_CLI_VERSION,
        },
        426,
      );
    }
    logger.warn("[cli-version] outdated", {
      version,
      min: env.MIN_CLI_VERSION,
      hardened: false,
    });
  }

  await next();
});
