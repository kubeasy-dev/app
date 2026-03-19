import { ChallengeDifficultySchema } from "@kubeasy/api-schemas/challenges";
import { ObjectiveTypeSchema } from "@kubeasy/api-schemas/objectives";
import { z } from "zod";

// ---- Enums ----
// Both source of truth in packages/api-schemas

export const objectiveCategorySchema = ObjectiveTypeSchema;
export const challengeDifficultySchema = ChallengeDifficultySchema;

// ---- CLI submission ----

// Raw result sent by the CLI per objective
export const objectiveResultSchema = z.object({
  objectiveKey: z.string(),
  passed: z.boolean(),
  message: z.string().optional(),
});

// Enriched objective stored in userSubmission.objectives
export const objectiveSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  passed: z.boolean(),
  category: objectiveCategorySchema,
  message: z.string().optional(),
});

export const submitBodySchema = z.object({
  results: z.array(objectiveResultSchema).min(1),
});

export type ObjectiveResult = z.infer<typeof objectiveResultSchema>;
export type Objective = z.infer<typeof objectiveSchema>;
export type SubmitBody = z.infer<typeof submitBodySchema>;

// ---- Challenge list filters ----

export const challengeFiltersSchema = z.object({
  difficulty: challengeDifficultySchema.optional(),
  type: z.string().optional(),
  theme: z.string().optional(),
  search: z.string().optional(),
  // Query strings are always strings; coerce "false" → false, everything else → true
  showCompleted: z
    .string()
    .optional()
    .transform((v) => v !== "false")
    .pipe(z.boolean()),
});

export type ChallengeFilters = z.infer<typeof challengeFiltersSchema>;

// ---- CLI metadata ----
export const cliMetadataSchema = z.object({
  cliVersion: z.string(),
  os: z.string(),
  arch: z.string(),
});
export type CliMetadata = z.infer<typeof cliMetadataSchema>;
