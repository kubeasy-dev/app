import { QUEUE_NAMES, type UserSignupPayload } from "@kubeasy/jobs";
import { all } from "better-all";
import { Worker } from "bullmq";
import { eq } from "drizzle-orm";
import { db } from "../db/index";
import { user } from "../db/schema/auth";
import { setUserProperties, trackUserSignup } from "../lib/analytics-server";
import { redisConfig } from "../lib/redis";
import { createResendContact } from "../lib/resend";

export function createUserSignupWorker() {
  const connection = { ...redisConfig, maxRetriesPerRequest: null as null };

  return new Worker<UserSignupPayload>(
    QUEUE_NAMES.USER_SIGNUP,
    async (job) => {
      const { userId, email, provider } = job.data;

      // Run all 3 operations in parallel with better-all
      const { resendResult } = await all({
        async identify() {
          await setUserProperties(userId, { email });
        },
        async resendResult() {
          try {
            return await createResendContact({ email, userId });
          } catch (err) {
            // Log and continue -- Resend failure should not block other operations
            console.error("[user-signin] Resend contact creation failed", {
              userId,
              error: String(err),
            });
            return null;
          }
        },
        async trackSignup() {
          await trackUserSignup(
            userId,
            provider as "github" | "google" | "microsoft",
            email,
          );
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
