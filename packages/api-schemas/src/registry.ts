import { z } from "zod";

export const RegistryObjectiveSchema = z.object({
  key: z.string(),
  title: z.string(),
  description: z.string(),
  order: z.number().int(),
  type: z.enum([
    "status",
    "condition",
    "log",
    "event",
    "connectivity",
    "rbac",
    "spec",
    "triggered",
  ]),
  spec: z.record(z.string(), z.unknown()),
});

export const RegistryChallengeSchema = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  theme: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  type: z.string(),
  estimatedTime: z.number().int(),
  initialSituation: z.string(),
  minRequiredVersion: z.string().optional(),
  objectives: z.array(RegistryObjectiveSchema),
});

export const RegistryThemeSchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  logo: z.string(),
});

export const RegistryTypeSchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  logo: z.string(),
});

export const RegistryMetaSchema = z.object({
  difficulties: z.array(z.string()),
  themes: z.array(RegistryThemeSchema),
  types: z.array(RegistryTypeSchema),
});

export type RegistryChallenge = z.infer<typeof RegistryChallengeSchema>;
export type RegistryObjective = z.infer<typeof RegistryObjectiveSchema>;
export type RegistryMeta = z.infer<typeof RegistryMetaSchema>;
export type RegistryTheme = z.infer<typeof RegistryThemeSchema>;
export type RegistryType = z.infer<typeof RegistryTypeSchema>;
