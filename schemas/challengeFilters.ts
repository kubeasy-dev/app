import { ChallengeDifficultySchema } from "@kubeasy/api-schemas/challenges";
import { z } from "zod";

export type ChallengeDifficulty = z.infer<typeof ChallengeDifficultySchema>;
export type ChallengeType = string;

export const challengeFiltersSchema = z.object({
  difficulty: ChallengeDifficultySchema.optional(),
  type: z.string().optional(),
  theme: z.string().optional(),
  showCompleted: z.boolean().default(true).optional(),
  search: z.string().optional(),
});

export type ChallengeFilters = z.infer<typeof challengeFiltersSchema>;
