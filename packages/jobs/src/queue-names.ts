export const QUEUE_NAMES = {
  CHALLENGE_SUBMISSION: "challenge-submission",
  XP_AWARD: "xp-award",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
