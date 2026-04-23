import { apiApp } from "./openapi-apps";

const servers = [
  { url: "https://kubeasy.dev", description: "Production" },
  { url: "http://localhost:3024", description: "Development" },
];

export function generateApiDocument() {
  return apiApp.getOpenAPI31Document({
    openapi: "3.1.0",
    info: {
      title: "Kubeasy API",
      version: "1.0.0",
      description:
        "Public API for the Kubeasy platform. Web routes use session cookie authentication; CLI routes use Bearer token authentication.",
    },
    servers,
    tags: [
      { name: "Challenges", description: "Challenge catalogue and objectives" },
      { name: "Progress", description: "User progress on challenges" },
      { name: "Submissions", description: "Challenge submission history" },
      { name: "User", description: "User profile and settings" },
      { name: "XP", description: "Experience points, ranking and streaks" },
      { name: "Onboarding", description: "New user onboarding flow" },
      {
        name: "Deprecated",
        description: "Legacy CLI routes kept for backward compatibility",
      },
    ],
  });
}
