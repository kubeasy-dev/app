import { createFsDrain } from "evlog/fs";
import evlog from "evlog/nitro/v3";
import { createOTLPDrain } from "evlog/otlp";
import { defineConfig } from "nitro/config";

const isDev = process.env.NODE_ENV !== "production";

export default defineConfig({
  experimental: { asyncContext: true },
  modules: [
    evlog({
      env: { service: "web" },
      drain: (ctx) => {
        if (isDev) createFsDrain()(ctx);
        createOTLPDrain()(ctx);
      },
    }),
  ],
});
