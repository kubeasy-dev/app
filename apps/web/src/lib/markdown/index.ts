import { isMarkdownPreferred } from "./accept";
import { renderBlogIndexMarkdown, renderBlogPostMarkdown } from "./blog";
import {
  renderChallengeIndexMarkdown,
  renderChallengeMarkdown,
} from "./challenge";
import { renderHomeMarkdown } from "./home";
import {
  buildMarkdownResponse,
  markdownError,
  markdownNotFound,
} from "./response";

const BLOG_POST_RE = /^\/blog\/([^/]+)\/?$/;
const CHALLENGE_RE = /^\/challenges\/([^/]+)\/?$/;

export async function dispatchMarkdown(
  request: Request,
): Promise<Response | null> {
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  if (!isMarkdownPreferred(request)) return null;

  const { pathname } = new URL(request.url);

  try {
    if (pathname === "/" || pathname === "") {
      const body = renderHomeMarkdown();
      return buildMarkdownResponse(body, request.method, pathname);
    }

    if (pathname === "/blog" || pathname === "/blog/") {
      const body = await renderBlogIndexMarkdown();
      return buildMarkdownResponse(body, request.method, pathname);
    }

    const blogMatch = BLOG_POST_RE.exec(pathname);
    if (blogMatch) {
      const slug = blogMatch[1];
      const body = await renderBlogPostMarkdown(slug);
      if (body === null) return markdownNotFound();
      return buildMarkdownResponse(body, request.method, pathname);
    }

    if (pathname === "/challenges" || pathname === "/challenges/") {
      const body = await renderChallengeIndexMarkdown();
      return buildMarkdownResponse(body, request.method, pathname);
    }

    const challengeMatch = CHALLENGE_RE.exec(pathname);
    if (challengeMatch) {
      const slug = challengeMatch[1];
      const body = await renderChallengeMarkdown(slug);
      if (body === null) return markdownNotFound();
      return buildMarkdownResponse(body, request.method, pathname);
    }
  } catch (err) {
    return markdownError(err);
  }

  return null;
}
