const CACHE_BY_PATTERN: Array<[RegExp, string]> = [
  [
    /^\/blog\/[^/]+$/,
    "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
  ],
  [
    /^\/blog\/?$/,
    "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
  ],
  [
    /^\/challenges\/[^/]+$/,
    "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
  ],
  [
    /^\/challenges\/?$/,
    "public, max-age=600, s-maxage=600, stale-while-revalidate=3600",
  ],
];

function cacheControlFor(pathname: string): string | null {
  for (const [pattern, value] of CACHE_BY_PATTERN) {
    if (pattern.test(pathname)) return value;
  }
  return null;
}

export function buildMarkdownResponse(
  body: string,
  method: string,
  pathname: string,
  status = 200,
): Response {
  const headers: Record<string, string> = {
    "Content-Type": "text/markdown; charset=utf-8",
    Vary: "Accept",
    "x-markdown-tokens": String(Math.ceil(body.length / 4)),
  };

  const cacheControl = cacheControlFor(pathname);
  if (cacheControl) headers["Cache-Control"] = cacheControl;

  return new Response(method === "HEAD" ? null : body, { status, headers });
}

export function markdownNotFound(): Response {
  return new Response("Not found", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export function markdownError(err: unknown): Response {
  const message = err instanceof Error ? err.message : String(err);
  return new Response(`Error generating markdown: ${message}`, {
    status: 502,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
