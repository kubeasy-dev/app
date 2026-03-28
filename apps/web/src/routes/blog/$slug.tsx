import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, ChevronLeft, Clock } from "lucide-react";
import { lazy, Suspense } from "react";
import { AuthorCard } from "@/components/author-card";
import { RelatedPosts } from "@/components/related-posts";
import { getBlogPostWithContent, getRelatedBlogPosts } from "@/lib/notion";

const BlogContent = lazy(() => import("@/components/blog-content"));
const TableOfContentsClient = lazy(
  () => import("@/components/table-of-contents"),
);

export const Route = createFileRoute("/blog/$slug")({
  headers: () => ({
    "Cache-Control":
      "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
  }),
  loader: async ({ params }) => {
    const post = await getBlogPostWithContent(params.slug);
    if (!post) throw new Error(`Blog post not found: ${params.slug}`);
    const relatedPosts = await getRelatedBlogPosts(post, 3);
    return { post, relatedPosts };
  },
  component: BlogArticlePage,
});

// ---- Page component ----

function BlogArticlePage() {
  const { post, relatedPosts } = Route.useLoaderData();

  const wordCount = post.blocks
    .filter((b) => b.type === "paragraph" && b.paragraph)
    .reduce((acc, b) => {
      const text =
        b.paragraph?.rich_text.map((t) => t.plain_text).join("") || "";
      return acc + text.split(/\s+/).length;
    }, 0);
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const formattedDate = new Date(post.publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const headings = post.headings;

  return (
    <article className="w-full overflow-x-clip">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        {/* Back link */}
        <div className="mb-6 sm:mb-8">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 font-bold text-muted-foreground hover:text-foreground transition-colors text-sm sm:text-base"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Blog
          </Link>
        </div>

        {/* Article header - Centered */}
        <header className="mb-8 sm:mb-12 text-center">
          {/* Category badge - clickable link */}
          <Link
            to="/blog"
            search={{ category: post.category.name }}
            className="inline-block mb-4 sm:mb-6"
          >
            <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary text-primary-foreground neo-border-thick font-bold shadow sm:neo-shadow text-xs sm:text-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all">
              {post.category.name}
            </span>
          </Link>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-balance leading-tight mb-4 sm:mb-6">
            {post.title}
          </h1>

          {post.description && (
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-6 sm:mb-8">
              {post.description}
            </p>
          )}

          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-6 text-sm font-medium">
            <div className="flex items-center gap-3">
              {post.author.avatar ? (
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="rounded-full neo-border w-8 h-8 sm:w-10 sm:h-10"
                />
              ) : (
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-black neo-border text-sm sm:text-base">
                  {post.author.name.charAt(0)}
                </div>
              )}
              <span className="font-bold">{post.author.name}</span>
            </div>

            <span className="hidden sm:inline text-muted-foreground">•</span>

            <div className="flex items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <time dateTime={post.publishedAt}>{formattedDate}</time>
              </div>

              <span className="text-muted-foreground">•</span>

              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{readingTime} min read</span>
              </div>
            </div>
          </div>

          {post.tags.length > 0 && (
            <div className="mt-4 sm:mt-6 flex flex-wrap justify-center gap-1.5 sm:gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs sm:text-sm font-bold text-muted-foreground bg-secondary neo-border px-2 sm:px-3 py-0.5 sm:py-1"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Mobile Table of Contents */}
        {headings.length > 0 && (
          <div className="lg:hidden mb-8">
            <Suspense>
              <TableOfContentsClient headings={headings} collapsible />
            </Suspense>
          </div>
        )}

        {/* Main content layout */}
        <div className="grid gap-8 sm:gap-12 lg:grid-cols-[1fr_250px] items-start">
          {/* Article content */}
          <div className="prose-neo max-w-none min-w-0">
            <Suspense>
              <BlogContent blocks={post.blocks} />
            </Suspense>

            {/* Author bio */}
            <div className="mt-10">
              <h2 className="text-lg sm:text-xl font-black mb-4 sm:mb-6 flex items-center gap-2">
                <span className="inline-block w-6 sm:w-8 h-1 bg-primary" />
                Written by
              </h2>
              <AuthorCard author={post.author} />
            </div>

            {/* Related posts */}
            <RelatedPosts posts={relatedPosts} />
          </div>

          {/* Sidebar - Table of Contents (Desktop only) */}
          {headings.length > 0 && (
            <aside className="hidden lg:block sticky top-28">
              <Suspense>
                <TableOfContentsClient headings={headings} />
              </Suspense>
            </aside>
          )}
        </div>
      </div>
    </article>
  );
}
