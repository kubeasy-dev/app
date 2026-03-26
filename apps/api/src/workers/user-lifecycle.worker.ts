import { QUEUE_NAMES, type UserSignupPayload } from "@kubeasy/jobs";
import { all } from "better-all";
import { Worker } from "bullmq";
import { eq } from "drizzle-orm";
import { db } from "../db/index";
import { account, user } from "../db/schema/auth";
import { setUserProperties, trackUserSignup } from "../lib/analytics-server";
import { redisConfig } from "../lib/redis";
import { createResendContact } from "../lib/resend";

export function createUserSignupWorker() {
  const connection = { ...redisConfig, maxRetriesPerRequest: null as null };

  return new Worker<UserSignupPayload>(
    QUEUE_NAMES.USER_SIGNUP,
    async (job) => {
      const { userId, email } = job.data;

      // Fetch the OAuth provider from the account table — not available at job
      // dispatch time (user.create.after fires before the account record is committed)
      const [userAccount] = await db
        .select({ providerId: account.providerId })
        .from(account)
        .where(eq(account.userId, userId))
        .limit(1);
      const provider = (userAccount?.providerId ?? "unknown") as
        | "github"
        | "google"
        | "microsoft";

      // Run all 3 operations in parallel with better-all
      const { resendResult } = await all({
        async identify() {
          await setUserProperties(userId, { email, provider });
        },
        async resendResult() {
          try {
            return await createResendContact({ email, userId });
          } catch (err) {
            // Log and continue -- Resend failure should not block other operations
            console.error("[user-signup] Resend contact creation failed", {
              userId,
              error: String(err),
            });
            return null;
          }
        },
        async trackSignup() {
          await trackUserSignup(userId, provider, email);
        },
      });

      // Store Resend contactId on user record if available
      if (resendResult?.contactId) {
        await db
          .update(user)
          .set({ resendContactId: resendResult.contactId })
          .where(eq(user.id, userId));
      }
    },
    { connection, concurrency: 5 },
  );
}
