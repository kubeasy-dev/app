import type { ConnectionOptions } from "bullmq";
import { Queue } from "bullmq";
import type { JobPayload } from "./payloads";
import type { QueueName } from "./queue-names";

export function createQueue<N extends QueueName>(
  name: N,
  connection: ConnectionOptions,
): Queue<JobPayload[N]> {
  return new Queue(name, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: { count: 1000, age: 86400 },
      removeOnFail: { count: 5000, age: 604800 },
    },
  });
}
