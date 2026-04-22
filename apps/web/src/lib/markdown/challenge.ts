import { api } from "@/lib/api-client";
import { difficultyLabels, siteConfig } from "@/lib/constants";

export async function renderChallengeIndexMarkdown(): Promise<string> {
  const { challenges, count } = await api.challenges.list();

  const listItems = challenges.map((c) => {
    const diff = difficultyLabels[c.difficulty] ?? c.difficulty;
    return `- [${c.title}](${siteConfig.url}/challenges/${c.slug}) — ${diff} · ${c.theme} · ${c.type} (${c.estimatedTime} min)`;
  });

  return [
    "# Kubernetes Challenges",
    "",
    "Master Kubernetes through hands-on practice. Each challenge is designed to teach you",
    "real-world skills you'll use in production.",
    "",
    `${count} challenges available:`,
    "",
    listItems.join("\n"),
    "",
    `Source: ${siteConfig.url}/challenges`,
  ].join("\n");
}

export async function renderChallengeMarkdown(
  slug: string,
): Promise<string | null> {
  const [detailResult, objectivesResult] = await Promise.all([
    api.challenges.getBySlug(slug),
    api.challenges.getObjectives(slug),
  ]);

  const challenge = detailResult.challenge;
  if (!challenge) return null;

  const diff = difficultyLabels[challenge.difficulty] ?? challenge.difficulty;

  const badges = [
    `**Difficulty:** ${diff}`,
    `**Theme:** ${challenge.theme}`,
    `**Type:** ${challenge.type}`,
    `**Estimated time:** ${challenge.estimatedTime} min`,
    challenge.ofTheWeek ? "**Challenge of the Week**" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const objectives = objectivesResult.objectives
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((o) => `- **${o.title}**: ${o.description}`)
    .join("\n");

  return [
    `# ${challenge.title}`,
    "",
    badges,
    "",
    challenge.description,
    "",
    "## Initial Situation",
    "",
    challenge.initialSituation,
    "",
    "## Objectives",
    "",
    objectives || "No objectives defined.",
    "",
    `Source: ${siteConfig.url}/challenges/${slug}`,
  ]
    .join("\n")
    .trim();
}
