import type { QUEUE_NAMES } from "./queue-names";

export interface ChallengeSubmissionPayload {
  userId: string;
  challengeSlug: string;
  challengeId: number;
}

export interface XpAwardPayload {
  userId: string;
  challengeId: number;
  xpAmount: number;
  action: "challenge_completed" | "daily_streak" | "first_challenge";
}

export interface UserSignupPayload {
  userId: string;
  email: string;
}

export type JobPayload = {
  [K in typeof QUEUE_NAMES.CHALLENGE_SUBMISSION]: ChallengeSubmissionPayload;
} & {
  [K in typeof QUEUE_NAMES.XP_AWARD]: XpAwardPayload;
} & {
  [K in typeof QUEUE_NAMES.USER_LIFECYCLE]: UserSignupPayload;
};
