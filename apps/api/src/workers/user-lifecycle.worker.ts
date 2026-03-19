import { QUEUE_NAMES, type UserSigninPayload } from "@kubeasy/jobs";
import { Worker } from "bullmq";
import { identifyUserServer } from "../lib/analytics-server.js";
import { createResendContact } from "../lib/resend.js";

export function createUserLifecycleWorker() {
  return new Worker<UserSigninPayload>(
    QUEUE_NAMES.USER_SIGNIN,
    async (job) => {
      const { userId, email } = job.data;

      await Promise.allSettled([
        createResendContact({ email, userId }),
        identifyUserServer(userId, { email }),
      ]);
    },
    {
      connection: {
        host: new URL(process.env.REDIS_URL ?? "redis://localhost:6379")
          .hostname,
        port: Number(
          new URL(process.env.REDIS_URL ?? "redis://localhost:6379").port ||
            6379,
        ),
        maxRetriesPerRequest: null,
      },
      concurrency: 5,
    },
  );
}
