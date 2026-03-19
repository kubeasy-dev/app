import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function useValidationSSE(slug: string, enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:3001";
    const url = `${apiBase}/api/sse/validation/${slug}`;
    const es = new EventSource(url, { withCredentials: true });

    es.addEventListener("validation-update", () => {
      queryClient.invalidateQueries({
        queryKey: ["submissions", "latest", slug],
      });
    });

    es.addEventListener("error", () => {
      // EventSource auto-reconnects on error — no manual retry needed.
      // If the server returned 401, EventSource will keep retrying.
      // This is acceptable: the SSE route returns 401 before opening stream,
      // so the browser will see a connection error and retry with backoff.
    });

    return () => {
      es.close();
    };
  }, [slug, enabled, queryClient]);
}
