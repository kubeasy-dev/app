import { createFsDrain } from "evlog/fs";
import { createEvlog } from "evlog/next";
import { createOTLPDrain } from "evlog/otlp";

const isDev = process.env.NODE_ENV !== "production";

export const { withEvlog, useLogger, log, createError } = createEvlog({
  service: "docs",
  drain: (ctx) => {
    if (isDev) createFsDrain()(ctx);
    createOTLPDrain()(ctx);
  },
  enrich: (_ctx) => {
    // Note: Better Auth identification usually requires the auth instance.
    // If docs app uses its own auth, import it here.
  },
});
