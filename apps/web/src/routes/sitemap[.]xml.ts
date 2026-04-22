import { createFileRoute } from "@tanstack/react-router";
import { api } from "@/lib/api-client";
import { siteConfig } from "@/lib/constants";
import { getBlogPosts } from "@/lib/notion";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function url(
  loc: string,
  opts?: { lastmod?: string; changefreq?: string; priority?: string },
): string {
  return [
    "  <url>",
    `    <loc>${escapeXml(loc)}</loc>`,
    opts?.lastmod ? `    <lastmod>${opts.lastmod}</lastmod>` : "",
    opts?.changefreq ? `    <changefreq>${opts.changefreq}</changefreq>` : "",
    opts?.priority ? `    <priority>${opts.priority}</priority>` : "",
    "  </url>",
  ]
    .filter(Boolean)
    .join("\n");
}

function toDate(d: Date | string): string {
  return new Date(d).toISOString().split("T")[0];
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const base = siteConfig.url;

        const staticUrls = [
          url(`${base}/`, { changefreq: "daily", priority: "1.0" }),
          url(`${base}/challenges`, { changefreq: "daily", priority: "0.9" }),
          url(`${base}/blog`, { changefreq: "weekly", priority: "0.8" }),
          url(`${base}/themes`, { changefreq: "weekly", priority: "0.7" }),
          url(`${base}/types`, { changefreq: "monthly", priority: "0.6" }),
        ];

        const [posts, challengeResult, themes, types] =
          await Promise.allSettled([
            getBlogPosts(),
            api.challenges.list(),
            api.themes.list(),
            api.types.list(),
          ]);

        const blogUrls =
          posts.status === "fulfilled"
            ? posts.value.map((p) =>
                url(`${base}/blog/${p.slug}`, {
                  lastmod: toDate(p.updatedAt),
                  changefreq: "monthly",
                  priority: "0.7",
                }),
              )
            : [];

        const challengeUrls =
          challengeResult.status === "fulfilled"
            ? challengeResult.value.challenges.map((c) =>
                url(`${base}/challenges/${c.slug}`, {
                  lastmod: toDate(c.updatedAt),
                  changefreq: "weekly",
                  priority: "0.8",
                }),
              )
            : [];

        const themeUrls =
          themes.status === "fulfilled"
            ? themes.value.map((t) =>
                url(`${base}/themes/${t.slug}`, {
                  changefreq: "monthly",
                  priority: "0.6",
                }),
              )
            : [];

        const typeUrls =
          types.status === "fulfilled"
            ? types.value.map((t) =>
                url(`${base}/types/${t.slug}`, {
                  changefreq: "monthly",
                  priority: "0.5",
                }),
              )
            : [];

        const sitemap = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          ...staticUrls,
          ...challengeUrls,
          ...themeUrls,
          ...typeUrls,
          ...blogUrls,
          "</urlset>",
        ].join("\n");

        return new Response(sitemap, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control":
              "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
          },
        });
      },
    },
  },
});
