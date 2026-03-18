import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { db } from "../db/index.js";
import * as schema from "../db/schema/auth.js";

export const auth = betterAuth({
  baseURL: process.env.API_URL ?? "http://localhost:3001",
  trustedOrigins: ["http://localhost:3000", "https://kubeasy.dev"],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  plugins: [admin()],
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  },
  // NO socialProviders -- OAuth deferred to Phase 3
});
