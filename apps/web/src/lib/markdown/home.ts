import { siteConfig } from "@/lib/constants";

export function renderHomeMarkdown(): string {
  const { name, tagline, description, url, links } = siteConfig;
  return [
    `# ${name}`,
    "",
    `**${tagline}**`,
    "",
    description,
    "",
    "## What is Kubeasy?",
    "",
    "Kubeasy is a free, open-source platform for learning Kubernetes through hands-on challenges.",
    "Instead of following theoretical tutorials, you are placed in realistic scenarios and must solve",
    "problems using standard Kubernetes tools (`kubectl`, logs, events). Every challenge mirrors a real",
    "production incident — you investigate, experiment, and fix it yourself.",
    "",
    "## Key Links",
    "",
    `- [Challenges](${url}/challenges) — Browse all Kubernetes challenges`,
    `- [Blog](${url}/blog) — Tutorials, deep dives, and Kubernetes guides`,
    `- [Documentation](${links.docs}) — Platform documentation`,
    `- [GitHub](${links.github}) — Open-source repository`,
    "",
    "## How It Works",
    "",
    "1. **Start a challenge** — the CLI deploys a broken Kubernetes environment to your local cluster",
    "2. **Investigate** — use `kubectl`, logs, and events to diagnose the issue",
    "3. **Fix it** — apply any valid Kubernetes solution",
    "4. **Submit** — the CLI validates your fix and awards XP",
    "",
    `Source: ${url}`,
  ].join("\n");
}
