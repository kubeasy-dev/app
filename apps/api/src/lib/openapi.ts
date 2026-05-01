import { generateSpecs } from "hono-openapi";
import { app } from "../app";

const servers = [
  { url: "https://kubeasy.dev", description: "Production" },
  { url: "http://localhost:3024", description: "Development" },
];

export async function generateApiDocument() {
  return generateSpecs(app, {
    documentation: {
      info: {
        title: "Kubeasy CLI API",
        version: "1.0.0",
        description:
          "Public API for the Kubeasy platform consumed by the CLI. " +
          "Web routes use session cookie authentication; CLI routes also accept Bearer token authentication.",
      },
      servers,
      components: {
        securitySchemes: {
          SessionAuth: {
            type: "apiKey",
            in: "cookie",
            name: "better-auth.session_token",
            description: "Session cookie set after login via better-auth",
          },
          BearerAuth: {
            type: "http",
            scheme: "bearer",
            description:
              "API key obtained via `kubeasy login`. Used by the CLI and accepted on all public API routes.",
          },
        },
      },
      tags: [
        { name: "CLI", description: "Routes consumed by the Kubeasy CLI" },
      ],
    },
    excludeMethods: ["OPTIONS", "HEAD"],
  });
}
