const MARKDOWN_TYPES = new Set(["text/markdown", "text/x-markdown"]);

export function isMarkdownPreferred(request: Request): boolean {
  const accept = request.headers.get("Accept") ?? "";
  if (!accept) return false;

  const entries = accept.split(",").map((entry) => {
    const parts = entry.trim().split(";");
    const type = parts[0].trim().toLowerCase();
    const qParam = parts.slice(1).find((p) => p.trim().startsWith("q="));
    const q = qParam ? Number.parseFloat(qParam.trim().slice(2)) : 1.0;
    return { type, q: Number.isNaN(q) ? 1.0 : q };
  });

  const markdownQ = entries
    .filter((e) => MARKDOWN_TYPES.has(e.type))
    .reduce((max, e) => Math.max(max, e.q), -1);

  if (markdownQ <= 0) return false;

  const htmlQ =
    entries.find((e) => e.type === "text/html")?.q ??
    entries.find((e) => e.type === "*/*")?.q ??
    0;

  return markdownQ > htmlQ;
}
