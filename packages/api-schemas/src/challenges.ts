import { z } from "zod";

// ---------- Enums ----------

export const challengeDifficultyValues = ["easy", "medium", "hard"] as const;
export const ChallengeDifficultySchema = z.enum(challengeDifficultyValues);
export type ChallengeDifficulty = z.infer<typeof ChallengeDifficultySchema>;

// ---------- Inputs ----------

export const ChallengeListInputSchema = z.object({
  difficulty: ChallengeDifficultySchema.optional(),
  type: z.string().optional(),
  theme: z.string().optional(),
  showCompleted: z.boolean().default(true).optional(),
  search: z.string().optional(),
});
export type ChallengeListInput = z.infer<typeof ChallengeListInputSchema>;

export const SlugInputSchema = z.object({
  slug: z.string(),
});
export type SlugInput = z.infer<typeof SlugInputSchema>;

export const ChallengeDeleteInputSchema = z.object({
  slug: z.string().min(1),
});
export type ChallengeDeleteInput = z.infer<typeof ChallengeDeleteInputSchema>;

export const ChallengeSetAvailabilityInputSchema = z.object({
  slug: z.string(),
  available: z.boolean(),
});
export type ChallengeSetAvailabilityInput = z.infer<
  typeof ChallengeSetAvailabilityInputSchema
>;

export const ChallengeCreateInputSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  theme: z.string().min(1),
  difficulty: ChallengeDifficultySchema,
  estimatedTime: z.number().int().positive(),
  initialSituation: z.string().min(1),
  ofTheWeek: z.boolean().default(false),
});
export type ChallengeCreateInput = z.infer<typeof ChallengeCreateInputSchema>;

// ---------- Outputs ----------

export const ChallengeListItemSchema = z.object({
  id: z.number().int(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  theme: z.string(),
  themeSlug: z.string(),
  difficulty: ChallengeDifficultySchema,
  type: z.string(),
  typeSlug: z.string(),
  estimatedTime: z.number().int(),
  initialSituation: z.string(),
  ofTheWeek: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  completedCount: z.number().int(),
  userStatus: z.string().nullable(),
});
export type ChallengeListItem = z.infer<typeof ChallengeListItemSchema>;

export const ChallengeListOutputSchema = z.object({
  challenges: z.array(ChallengeListItemSchema),
  count: z.number().int(),
});
export type ChallengeListOutput = z.infer<typeof ChallengeListOutputSchema>;

export const ChallengeDetailSchema = z.object({
  id: z.number().int(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  theme: z.string(),
  themeSlug: z.string(),
  difficulty: ChallengeDifficultySchema,
  type: z.string(),
  typeSlug: z.string(),
  estimatedTime: z.number().int(),
  initialSituation: z.string(),
  ofTheWeek: z.boolean(),
  available: z.boolean(),
  starterFriendly: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type ChallengeDetail = z.infer<typeof ChallengeDetailSchema>;

export const ChallengeGetBySlugOutputSchema = z.object({
  challenge: ChallengeDetailSchema.nullable(),
});
export type ChallengeGetBySlugOutput = z.infer<
  typeof ChallengeGetBySlugOutputSchema
>;

export const ChallengeObjectiveItemSchema = z.object({
  id: z.number().int(),
  objectiveKey: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  displayOrder: z.number().int(),
});
export type ChallengeObjectiveItem = z.infer<
  typeof ChallengeObjectiveItemSchema
>;

export const ChallengeGetObjectivesOutputSchema = z.object({
  objectives: z.array(ChallengeObjectiveItemSchema),
});
export type ChallengeGetObjectivesOutput = z.infer<
  typeof ChallengeGetObjectivesOutputSchema
>;

export const ChallengeCreateOutputSchema = z.object({
  success: z.boolean(),
  challenge: z.any(),
  action: z.enum(["created", "updated"]),
});
export type ChallengeCreateOutput = z.infer<typeof ChallengeCreateOutputSchema>;

export const ChallengeDeleteOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type ChallengeDeleteOutput = z.infer<typeof ChallengeDeleteOutputSchema>;

// ---------- Admin ----------

export const AdminChallengeItemSchema = z.object({
  id: z.number().int(),
  slug: z.string(),
  title: z.string(),
  difficulty: ChallengeDifficultySchema,
  theme: z.string(),
  type: z.string(),
  available: z.boolean(),
  ofTheWeek: z.boolean(),
  createdAt: z.coerce.date(),
  starts: z.number().int(),
  completions: z.number().int(),
  totalSubmissions: z.number().int(),
  successfulSubmissions: z.number().int(),
});
export type AdminChallengeItem = z.infer<typeof AdminChallengeItemSchema>;

export const AdminChallengeListOutputSchema = z.object({
  challenges: z.array(AdminChallengeItemSchema),
});
export type AdminChallengeListOutput = z.infer<
  typeof AdminChallengeListOutputSchema
>;

export const AdminStatsOutputSchema = z.object({
  totalSubmissions: z.number().int(),
  successfulSubmissions: z.number().int(),
  successRate: z.number(),
  totalStarts: z.number().int(),
  totalCompletions: z.number().int(),
  completionRate: z.number(),
});
export type AdminStatsOutput = z.infer<typeof AdminStatsOutputSchema>;
