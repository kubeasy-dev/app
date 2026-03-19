import { type ChallengeSubmissionPayload, QUEUE_NAMES } from "@kubeasy/jobs";
import { Worker } from "bullmq";
import { trackChallengeCompletedServer } from "../lib/analytics-server.js";

export function createChallengeSubmissionWorker() {
  return new Worker<ChallengeSubmissionPayload>(
    QUEUE_NAMES.CHALLENGE_SUBMISSION,
    async (job) => {
      const { userId, challengeSlug, challengeId, difficulty } = job.data;

      // TODO(Plan 03): Compute XP/streak here and pass real values.
      // Analytics called with placeholder values until Plan 03 implements XP logic.
      await trackChallengeCompletedServer(
        userId,
        challengeId,
        challengeSlug,
        difficulty,
        0,
        false,
      );
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
