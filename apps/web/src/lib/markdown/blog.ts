import { siteConfig } from "@/lib/constants";
import type { BlogPost } from "@/lib/notion";
import { getBlogPosts, getBlogPostWithContent } from "@/lib/notion";
import { notionBlocksToMarkdown } from "./notion-to-md";

export async function renderBlogIndexMarkdown(): Promise<string> {
  const posts = await getBlogPosts();

  const pinned = posts.filter((p) => p.isPinned);
  const regular = posts.filter((p) => !p.isPinned);
  const ordered = [...pinned, ...regular];

  const listItems = ordered.map((post) => {
    const category = post.category?.name ? ` \`${post.category.name}\`` : "";
    return `- [${post.title}](${siteConfig.url}/blog/${post.slug})${category} — ${post.description}`;
  });

  return [
    "# Kubeasy Blog",
    "",
    "Deep dives into Kubernetes, DevOps practices, and cloud-native development.",
    "Learn from real-world experiences and best practices.",
    "",
    `${posts.length} articles:`,
    "",
    listItems.join("\n"),
    "",
    `Source: ${siteConfig.url}/blog`,
  ].join("\n");
}

export async function renderBlogPostMarkdown(
  slug: string,
): Promise<string | null> {
  const [post, allPosts] = await Promise.all([
    getBlogPostWithContent(slug),
    getBlogPosts(),
  ]);

  if (!post) return null;

  const wordCount = post.blocks
    .filter((b) => b.type === "paragraph" && b.paragraph?.rich_text.length)
    .reduce((acc, b) => {
      const text =
        b.paragraph?.rich_text.map((t) => t.plain_text).join("") ?? "";
      return acc + text.split(/\s+/).filter(Boolean).length;
    }, 0);
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const formattedDate = new Date(post.publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const relatedPosts = allPosts
    .filter(
      (p: BlogPost) =>
        p.slug !== slug && p.category?.name === post.category?.name,
    )
    .slice(0, 3);

  const tags = post.tags.length ? `tags: ${post.tags.join(", ")}` : null;
  const meta = [
    `author: ${post.author.name}`,
    `category: ${post.category?.name ?? "Uncategorized"}`,
    `published: ${formattedDate}`,
    `reading_time: ${readingTime} min`,
    tags,
    `canonical: ${siteConfig.url}/blog/${slug}`,
  ]
    .filter(Boolean)
    .join("\n");

  const body = notionBlocksToMarkdown(post.blocks);

  const relatedSection =
    relatedPosts.length > 0
      ? [
          "",
          "## Related Posts",
          "",
          relatedPosts
            .map(
              (p: BlogPost) =>
                `- [${p.title}](${siteConfig.url}/blog/${p.slug})`,
            )
            .join("\n"),
        ].join("\n")
      : "";

  return [
    `# ${post.title}`,
    "",
    meta,
    "",
    ...(post.description ? [post.description, ""] : []),
    body,
    relatedSection,
  ]
    .join("\n")
    .trim();
}
