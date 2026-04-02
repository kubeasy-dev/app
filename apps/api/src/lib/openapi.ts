import { ChallengeDifficultySchema } from "@kubeasy/api-schemas/challenges";
import {
  ConditionCheckSchema,
  ConditionSpecSchema,
  ConnectivityCheckSchema,
  ConnectivitySpecSchema,
  EventSpecSchema,
  LogSpecSchema,
  ObjectiveSchema,
  ObjectiveSpecSchema,
  ObjectiveTypeSchema,
  SourcePodSchema,
  StatusCheckSchema,
  StatusSpecSchema,
  TargetSchema,
} from "@kubeasy/api-schemas/objectives";
import { z } from "zod";
import {
  cliMetadataSchema,
  objectiveResultSchema,
  objectiveSchema,
  submitBodySchema,
} from "../schemas/index";
import { challengeSyncSchema, syncRequestSchema } from "../schemas/sync";

/** Convert a Zod schema to a JSON Schema object, stripping the top-level $schema key. */
function toSchema(zodSchema: z.ZodTypeAny): Record<string, unknown> {
  const { $schema: _, ...rest } = z.toJSONSchema(zodSchema) as Record<
    string,
    unknown
  >;
  return rest;
}

const errorResponse = {
  type: "object",
  properties: {
    error: { type: "string" },
    details: { type: "string" },
  },
  required: ["error"],
  additionalProperties: false,
};

const commonErrorResponses = {
  "400": {
    description: "Bad request",
    content: { "application/json": { schema: errorResponse } },
  },
  "401": {
    description: "Unauthorized",
    content: { "application/json": { schema: errorResponse } },
  },
  "500": {
    description: "Internal server error",
    content: { "application/json": { schema: errorResponse } },
  },
};

/** Shared component schemas used by both CLI and Sync specs. */
const sharedComponents = {
  securitySchemes: {
    BearerAuth: {
      type: "http",
      scheme: "bearer",
      description: "API key obtained via `kubeasy login`",
    },
  },
  schemas: {
    ChallengeDifficulty: {
      description: "Challenge difficulty level",
      ...toSchema(ChallengeDifficultySchema),
    },
    ObjectiveType: {
      description:
        "Type of objective validation. Determines which spec fields are required.",
      ...toSchema(ObjectiveTypeSchema),
    },
    Objective: {
      description:
        "A single objective definition as it appears in `challenge.yaml`",
      ...toSchema(ObjectiveSchema),
    },
    ObjectiveSpec: {
      description:
        "Union of all possible objective spec shapes. The actual shape depends on the objective `type`.",
      ...toSchema(ObjectiveSpecSchema),
    },
    Target: {
      description:
        "Kubernetes resource target — identifies which resources to check",
      ...toSchema(TargetSchema),
    },
    StatusCheck: {
      description: "A single status field check (field/operator/value)",
      ...toSchema(StatusCheckSchema),
    },
    StatusSpec: {
      description:
        "Spec for `type: status` objectives — checks resource status fields",
      ...toSchema(StatusSpecSchema),
    },
    ConditionCheck: {
      description: "A single Kubernetes condition check (type/status pair)",
      ...toSchema(ConditionCheckSchema),
    },
    ConditionSpec: {
      description:
        "Spec for `type: condition` objectives — checks Kubernetes conditions",
      ...toSchema(ConditionSpecSchema),
    },
    LogSpec: {
      description:
        "Spec for `type: log` objectives — searches container logs for expected strings",
      ...toSchema(LogSpecSchema),
    },
    EventSpec: {
      description:
        "Spec for `type: event` objectives — detects forbidden Kubernetes events",
      ...toSchema(EventSpecSchema),
    },
    SourcePod: {
      description:
        "Source pod for connectivity checks (identified by name or label selector)",
      ...toSchema(SourcePodSchema),
    },
    ConnectivityCheck: {
      description: "A single HTTP connectivity check",
      ...toSchema(ConnectivityCheckSchema),
    },
    ConnectivitySpec: {
      description:
        "Spec for `type: connectivity` objectives — tests HTTP connectivity from a pod",
      ...toSchema(ConnectivitySpecSchema),
    },
  },
};

// ---------------------------------------------------------------------------
// CLI API spec
// ---------------------------------------------------------------------------

export function generateCliApiDocument() {
  return {
    openapi: "3.1.0",
    info: {
      title: "Kubeasy CLI API",
      version: "1.0.0",
      description:
        "API consumed by the `kubeasy` CLI. Authentication uses a Bearer API key obtained via `kubeasy login`.",
    },
    servers: [
      { url: "https://kubeasy.dev", description: "Production" },
      { url: "http://localhost:3024", description: "Development" },
    ],
    tags: [
      { name: "Auth", description: "CLI authentication and session tracking" },
      { name: "Challenges", description: "Challenge management" },
      { name: "Progress", description: "User progress on challenges" },
      { name: "Metadata", description: "Static reference data (no auth)" },
    ],
    paths: {
      // --- Auth / tracking ---
      "/api/cli/user": {
        get: {
          operationId: "getUser",
          summary: "Get current user (deprecated)",
          deprecated: true,
          tags: ["Auth"],
          security: [{ BearerAuth: [] }],
          responses: {
            "200": {
              description: "User profile",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      firstName: { type: "string" },
                      lastName: { type: ["string", "null"] },
                    },
                    required: ["firstName", "lastName"],
                    additionalProperties: false,
                  },
                },
              },
            },
            "401": commonErrorResponses["401"],
            "500": commonErrorResponses["500"],
          },
        },
        post: {
          operationId: "loginUser",
          summary: "Authenticate and track CLI metadata",
          tags: ["Auth"],
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CliMetadata" },
              },
            },
          },
          responses: {
            "200": {
              description: "User profile with first-login flag",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      firstName: { type: "string" },
                      lastName: { type: ["string", "null"] },
                      firstLogin: { type: "boolean" },
                    },
                    required: ["firstName", "lastName", "firstLogin"],
                    additionalProperties: false,
                  },
                },
              },
            },
            "400": commonErrorResponses["400"],
            "401": commonErrorResponses["401"],
            "500": commonErrorResponses["500"],
          },
        },
      },
      "/api/cli/track/setup": {
        post: {
          operationId: "trackSetup",
          summary: "Track CLI cluster initialisation",
          tags: ["Auth"],
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CliMetadata" },
              },
            },
          },
          responses: {
            "200": {
              description: "Setup tracked",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      firstTime: { type: "boolean" },
                    },
                    required: ["success", "firstTime"],
                    additionalProperties: false,
                  },
                },
              },
            },
            "400": commonErrorResponses["400"],
            "401": commonErrorResponses["401"],
            "500": commonErrorResponses["500"],
          },
        },
      },
      // --- Challenges ---
      "/api/challenges/{slug}": {
        get: {
          operationId: "getChallenge",
          summary: "Get challenge details",
          tags: ["Challenges"],
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "slug",
              required: true,
              schema: { type: "string", example: "pod-evicted" },
              description: "Challenge slug",
            },
          ],
          responses: {
            "200": {
              description: "Challenge details",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      challenge: {
                        type: "object",
                        properties: {
                          id: { type: "integer" },
                          title: { type: "string" },
                          slug: { type: "string" },
                          description: { type: "string" },
                          difficulty: {
                            $ref: "#/components/schemas/ChallengeDifficulty",
                          },
                          theme: { type: "string" },
                          initialSituation: { type: "string" },
                        },
                        required: [
                          "id",
                          "title",
                          "slug",
                          "description",
                          "difficulty",
                          "theme",
                          "initialSituation",
                        ],
                        additionalProperties: false,
                      },
                    },
                    required: ["challenge"],
                  },
                },
              },
            },
            "401": commonErrorResponses["401"],
            "404": {
              description: "Challenge not found",
              content: { "application/json": { schema: errorResponse } },
            },
            "500": commonErrorResponses["500"],
          },
        },
      },
      "/api/challenges/{slug}/submit": {
        post: {
          operationId: "submitChallenge",
          summary: "Submit challenge validation results",
          tags: ["Challenges"],
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "slug",
              required: true,
              schema: { type: "string", example: "pod-evicted" },
              description: "Challenge slug",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SubmitBody" },
              },
            },
          },
          responses: {
            "200": {
              description: "All objectives passed",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", const: true },
                      objectives: {
                        type: "array",
                        items: { $ref: "#/components/schemas/ScoredObjective" },
                      },
                    },
                    required: ["success", "objectives"],
                    additionalProperties: false,
                  },
                },
              },
            },
            "400": commonErrorResponses["400"],
            "401": commonErrorResponses["401"],
            "404": {
              description: "Challenge not found",
              content: { "application/json": { schema: errorResponse } },
            },
            "409": {
              description: "Challenge already completed",
              content: { "application/json": { schema: errorResponse } },
            },
            "422": {
              description:
                "Some objectives failed or missing/unknown objectives",
              content: {
                "application/json": {
                  schema: {
                    oneOf: [
                      {
                        type: "object",
                        description: "Some objectives did not pass",
                        properties: {
                          success: { type: "boolean", const: false },
                          objectives: {
                            type: "array",
                            items: {
                              $ref: "#/components/schemas/ScoredObjective",
                            },
                          },
                          failedObjectives: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                id: { type: "string" },
                                name: { type: "string" },
                                message: { type: "string" },
                              },
                              required: ["id", "name", "message"],
                            },
                          },
                        },
                        required: ["success", "objectives", "failedObjectives"],
                      },
                      {
                        description: "Missing or unknown objectives",
                        ...errorResponse,
                      },
                    ],
                  },
                },
              },
            },
            "500": commonErrorResponses["500"],
          },
        },
      },
      // --- Progress ---
      "/api/progress/{slug}": {
        get: {
          operationId: "getChallengeStatus",
          summary: "Get challenge progress",
          tags: ["Progress"],
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "slug",
              required: true,
              schema: { type: "string", example: "pod-evicted" },
            },
          ],
          responses: {
            "200": {
              description: "Challenge progress",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: {
                        type: "string",
                        enum: ["not_started", "in_progress", "completed"],
                      },
                      startedAt: {
                        type: "string",
                        description: "ISO 8601 date string",
                      },
                      completedAt: {
                        type: "string",
                        description: "ISO 8601 date string",
                      },
                    },
                    required: ["status"],
                    additionalProperties: false,
                  },
                },
              },
            },
            "401": commonErrorResponses["401"],
            "404": {
              description: "Challenge not found",
              content: { "application/json": { schema: errorResponse } },
            },
            "500": commonErrorResponses["500"],
          },
        },
      },
      "/api/progress/{slug}/start": {
        post: {
          operationId: "startChallenge",
          summary: "Start a challenge",
          tags: ["Progress"],
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "slug",
              required: true,
              schema: { type: "string", example: "pod-evicted" },
            },
          ],
          responses: {
            "200": {
              description: "Challenge started",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: {
                        type: "string",
                        enum: ["in_progress", "completed"],
                      },
                      startedAt: { type: "string" },
                      message: { type: "string" },
                    },
                    required: ["status", "startedAt"],
                    additionalProperties: false,
                  },
                },
              },
            },
            "401": commonErrorResponses["401"],
            "404": {
              description: "Challenge not found",
              content: { "application/json": { schema: errorResponse } },
            },
            "500": commonErrorResponses["500"],
          },
        },
      },
      "/api/progress/{slug}/reset": {
        post: {
          operationId: "resetChallenge",
          summary: "Reset challenge progress",
          tags: ["Progress"],
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "slug",
              required: true,
              schema: { type: "string", example: "pod-evicted" },
            },
          ],
          responses: {
            "200": {
              description: "Progress reset",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      message: { type: "string" },
                    },
                    required: ["success", "message"],
                    additionalProperties: false,
                  },
                },
              },
            },
            "401": commonErrorResponses["401"],
            "404": {
              description: "Challenge not found",
              content: { "application/json": { schema: errorResponse } },
            },
            "500": commonErrorResponses["500"],
          },
        },
      },
      // --- Metadata ---
      "/api/types": {
        get: {
          operationId: "getTypes",
          summary: "List challenge types",
          tags: ["Metadata"],
          responses: {
            "200": {
              description: "List of challenge types",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      types: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            slug: { type: "string" },
                            name: { type: "string" },
                            description: { type: "string" },
                            logo: { type: ["string", "null"] },
                          },
                          required: ["slug", "name", "description", "logo"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["types"],
                    additionalProperties: false,
                  },
                },
              },
            },
            "500": commonErrorResponses["500"],
          },
        },
      },
      "/api/themes": {
        get: {
          operationId: "getThemes",
          summary: "List challenge themes",
          tags: ["Metadata"],
          responses: {
            "200": {
              description: "List of challenge themes",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      themes: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            slug: { type: "string" },
                            name: { type: "string" },
                            description: { type: "string" },
                            logo: { type: ["string", "null"] },
                          },
                          required: ["slug", "name", "description", "logo"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["themes"],
                    additionalProperties: false,
                  },
                },
              },
            },
            "500": commonErrorResponses["500"],
          },
        },
      },
    },
    components: {
      ...sharedComponents,
      schemas: {
        ...sharedComponents.schemas,
        CliMetadata: {
          description: "CLI metadata sent with tracking requests",
          ...toSchema(cliMetadataSchema),
        },
        ObjectiveResult: {
          description: "Result from a single objective validation",
          ...toSchema(objectiveResultSchema),
        },
        SubmitBody: {
          description: "Challenge submission payload sent by the CLI",
          ...toSchema(submitBodySchema),
        },
        ScoredObjective: {
          description: "Enriched objective result stored after submission",
          ...toSchema(objectiveSchema),
        },
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Sync API spec (for CI/CD challenge synchronisation)
// ---------------------------------------------------------------------------

export function generateSyncApiDocument() {
  return {
    openapi: "3.1.0",
    info: {
      title: "Kubeasy Sync API",
      version: "1.0.0",
      description:
        "API used by CI/CD pipelines to synchronise challenges from the challenges repository. Requires a Bearer API key with admin privileges.",
    },
    servers: [
      { url: "https://kubeasy.dev", description: "Production" },
      { url: "http://localhost:3024", description: "Development" },
    ],
    tags: [
      {
        name: "Sync",
        description: "Challenge synchronisation from the challenges repository",
      },
    ],
    paths: {
      "/api/admin/challenges/sync": {
        post: {
          operationId: "syncChallenges",
          summary: "Sync all challenges from source of truth",
          description:
            "Full upsert/delete sync of challenges and their objectives. Intended to be called from CI/CD after merging to the challenges repository.",
          tags: ["Sync"],
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SyncRequest" },
              },
            },
          },
          responses: {
            "200": {
              description: "Sync completed",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      created: { type: "integer" },
                      updated: { type: "integer" },
                      deleted: { type: "integer" },
                      details: {
                        type: "object",
                        properties: {
                          created: { type: "array", items: { type: "string" } },
                          updated: { type: "array", items: { type: "string" } },
                          deleted: { type: "array", items: { type: "string" } },
                        },
                        required: ["created", "updated", "deleted"],
                      },
                    },
                    required: [
                      "success",
                      "created",
                      "updated",
                      "deleted",
                      "details",
                    ],
                    additionalProperties: false,
                  },
                },
              },
            },
            "400": commonErrorResponses["400"],
            "401": commonErrorResponses["401"],
            "500": commonErrorResponses["500"],
          },
        },
      },
    },
    components: {
      ...sharedComponents,
      schemas: {
        ...sharedComponents.schemas,
        ChallengeSyncItem: {
          description:
            "A single challenge entry in a sync request, including its objectives",
          ...toSchema(challengeSyncSchema),
        },
        SyncRequest: {
          description:
            "Full sync payload — the complete list of challenges to synchronise",
          ...toSchema(syncRequestSchema),
        },
      },
    },
  };
}
