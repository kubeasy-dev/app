// ⚠️ AUTO-GENERATED - DO NOT EDIT
// Source: github.com/kubeasy-dev/registry/pkg/challenges
// Run: go run . generate-schema
// biome-ignore-all lint: auto-generated file

import { z } from "zod";

export const TargetSchema = z.object({
  kind: z.string(),
  name: z.string().optional(),
  labelSelector: z.record(z.string(), z.string()).optional(),
})
export type Target = z.infer<typeof TargetSchema>

export const StatusCheckSchema = z.object({
  field: z.string(),
  operator: z.string(),
  value: z.any(),
})
export type StatusCheck = z.infer<typeof StatusCheckSchema>

export const ConditionCheckSchema = z.object({
  type: z.string(),
  status: z.string(),
})
export type ConditionCheck = z.infer<typeof ConditionCheckSchema>

export const SourcePodSchema = z.object({
  name: z.string().optional(),
  labelSelector: z.record(z.string(), z.string()).optional(),
  namespace: z.string().optional(),
})
export type SourcePod = z.infer<typeof SourcePodSchema>

export const TLSConfigSchema = z.object({
  insecureSkipVerify: z.boolean().optional(),
  validateExpiry: z.boolean().optional(),
  validateSANs: z.boolean().optional(),
})
export type TLSConfig = z.infer<typeof TLSConfigSchema>

export const ConnectivityCheckSchema = z.object({
  url: z.string(),
  expectedStatusCode: z.number(),
  timeoutSeconds: z.number().optional(),
  hostHeader: z.string().optional(),
  tls: TLSConfigSchema.optional(),
})
export type ConnectivityCheck = z.infer<typeof ConnectivityCheckSchema>

export const RbacCheckSchema = z.object({
  verb: z.string(),
  resource: z.string(),
  subresource: z.string().optional(),
  namespace: z.string().optional(),
  allowed: z.boolean(),
})
export type RbacCheck = z.infer<typeof RbacCheckSchema>

export const ThemeSchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  logo: z.string(),
})
export type Theme = z.infer<typeof ThemeSchema>

export const ChallengeTypeInfoSchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  logo: z.string(),
})
export type ChallengeTypeInfo = z.infer<typeof ChallengeTypeInfoSchema>

export const StatusSpecSchema = z.object({
  target: TargetSchema,
  checks: StatusCheckSchema.array().nullable(),
})
export type StatusSpec = z.infer<typeof StatusSpecSchema>

export const ConditionSpecSchema = z.object({
  target: TargetSchema,
  checks: ConditionCheckSchema.array().nullable(),
})
export type ConditionSpec = z.infer<typeof ConditionSpecSchema>

export const LogSpecSchema = z.object({
  target: TargetSchema,
  container: z.string().optional(),
  expectedStrings: z.string().array().nullable(),
  sinceSeconds: z.number().optional(),
  previous: z.boolean().optional(),
  matchMode: z.string().optional(),
})
export type LogSpec = z.infer<typeof LogSpecSchema>

export const EventSpecSchema = z.object({
  target: TargetSchema,
  forbiddenReasons: z.string().array().nullable(),
  requiredReasons: z.string().array().optional(),
  sinceSeconds: z.number().optional(),
})
export type EventSpec = z.infer<typeof EventSpecSchema>

export const ConnectivitySpecSchema = z.object({
  mode: z.string().optional(),
  sourcePod: SourcePodSchema,
  targets: ConnectivityCheckSchema.array().nullable(),
})
export type ConnectivitySpec = z.infer<typeof ConnectivitySpecSchema>

export const RbacSpecSchema = z.object({
  serviceAccount: z.string(),
  namespace: z.string(),
  checks: RbacCheckSchema.array().nullable(),
})
export type RbacSpec = z.infer<typeof RbacSpecSchema>

export const SpecCheckSchema = z.object({
  path: z.string(),
  exists: z.boolean().optional(),
  value: z.any(),
  contains: z.any(),
})
export type SpecCheck = z.infer<typeof SpecCheckSchema>

export const SpecSpecSchema = z.object({
  target: TargetSchema,
  checks: SpecCheckSchema.array().nullable(),
})
export type SpecSpec = z.infer<typeof SpecSpecSchema>

export const TriggerConfigSchema = z.object({
  type: z.string(),
  url: z.string().optional(),
  requestsPerSecond: z.number().optional(),
  durationSeconds: z.number().optional(),
  sourcePod: SourcePodSchema.optional(),
  target: TargetSchema.optional(),
  image: z.string().optional(),
  container: z.string().optional(),
  replicas: z.number().optional(),
  waitSeconds: z.number().optional(),
})
export type TriggerConfig = z.infer<typeof TriggerConfigSchema>

export const ObjectiveSchema = z.object({
  key: z.string(),
  title: z.string(),
  description: z.string(),
  order: z.number(),
  type: z.string(),
  spec: z.any(),
})
export type Objective = z.infer<typeof ObjectiveSchema>

export const TriggeredSpecSchema = z.object({
  trigger: TriggerConfigSchema,
  waitAfterSeconds: z.number(),
  then: ObjectiveSchema.array().nullable(),
})
export type TriggeredSpec = z.infer<typeof TriggeredSpecSchema>

export const objectiveTypeValues = [
  "status",
  "condition",
  "log",
  "event",
  "connectivity",
  "rbac",
  "spec",
  "triggered",
] as const;
export const ObjectiveTypeSchema = z.enum(objectiveTypeValues);
export type ObjectiveType = z.infer<typeof ObjectiveTypeSchema>;

export const ObjectiveSpecSchema = z.union([
  StatusSpecSchema,
  ConditionSpecSchema,
  LogSpecSchema,
  EventSpecSchema,
  ConnectivitySpecSchema,
  RbacSpecSchema,
  SpecSpecSchema,
  TriggeredSpecSchema,
]);
export type ObjectiveSpec = z.infer<typeof ObjectiveSpecSchema>;

export const ObjectiveSchema = z.object({
  key: z.string(),
  title: z.string(),
  description: z.string(),
  order: z.number().int(),
  type: ObjectiveTypeSchema,
  spec: ObjectiveSpecSchema,
});
export type Objective = z.infer<typeof ObjectiveSchema>;

export const challengeDifficultyValues = ["easy", "medium", "hard"] as const;
export const ChallengeDifficultySchema = z.enum(challengeDifficultyValues);
export type ChallengeDifficulty = z.infer<typeof ChallengeDifficultySchema>;

export const challengeTypeValues = ["fix", "build", "migrate"] as const;
export const ChallengeTypeSchema = z.enum(challengeTypeValues);
export type ChallengeType = z.infer<typeof ChallengeTypeSchema>;

export const challengeThemeValues = ["pods-containers", "resources-scaling", "networking", "volumes-secrets", "rbac-security", "scheduling-affinity", "jobs-cronjobs", "ingress-tls", "monitoring-debugging"] as const;
export const ChallengeThemeSchema = z.enum(challengeThemeValues);
export type ChallengeTheme = z.infer<typeof ChallengeThemeSchema>;

// ChallengeSchema mirrors the Challenge struct in pkg/challenges/types.go.
// difficulty and type are narrowed to enums; objectives uses the typed ObjectiveSchema.
export const ChallengeSchema = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  theme: ChallengeThemeSchema,
  difficulty: ChallengeDifficultySchema,
  type: ChallengeTypeSchema,
  estimatedTime: z.number().int(),
  initialSituation: z.string(),
  minRequiredVersion: z.string().optional(),
  objectives: z.array(ObjectiveSchema),
});
export type Challenge = z.infer<typeof ChallengeSchema>;

// ChallengeYamlSchema is the challenge.yaml file format — same shape as ChallengeSchema
// minus the slug (which is derived from the folder name by the registry loader).
export const ChallengeYamlSchema = ChallengeSchema.omit({ slug: true });
export type ChallengeYaml = z.infer<typeof ChallengeYamlSchema>;

// RegistryMetaSchema mirrors the GET /meta response from the registry.
export const RegistryMetaSchema = z.object({
  themes: z.array(ThemeSchema),
  types: z.array(ChallengeTypeInfoSchema),
  difficulties: z.array(z.string()),
});
export type RegistryMeta = z.infer<typeof RegistryMetaSchema>;
