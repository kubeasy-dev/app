import type { AppType } from "@kubeasy/api/app-type";
import { createIsomorphicFn } from "@tanstack/react-start";
import { hc } from "hono/client";

const getSSRCookie = createIsomorphicFn()
  .client(() => null)
  .server(async () => {
    const { getRequestHeaders } = await import("@tanstack/react-start/server");
    return getRequestHeaders().get("Cookie");
  });

const API_BASE =
  typeof window !== "undefined"
    ? ""
    : (() => {
        const base =
          typeof process !== "undefined" && process.env.VITE_API_URL
            ? process.env.VITE_API_URL
            : (import.meta.env.VITE_API_URL ?? "http://api:3001");
        return base.replace(/\/api\/auth$/, "");
      })();

// Custom fetch wrapper:
//  - forwards the SSR Cookie header (browser ignores `credentials: include` server-side)
//  - sets `credentials: include` for the browser
const rpcFetch: typeof fetch = async (input, init) => {
  const cookie = await getSSRCookie();
  const headers = new Headers(init?.headers);
  if (cookie) headers.set("Cookie", cookie);
  return fetch(input, { ...init, headers, credentials: "include" });
};

// `hc<AppType>(base).api` so callers write `rpc.progress[":slug"].$get(...)`
// instead of `rpc.api.progress[...]`.
export const rpc = hc<AppType>(API_BASE, { fetch: rpcFetch }).api;

export type Rpc = typeof rpc;

// Error thrown by `unwrap` on non-2xx responses. Carries the parsed body
// (when available) so callers can surface structured details like
// `failedObjectives` from a 422 submit response.
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Helper that throws on non-2xx and returns parsed JSON.
// On error, reads the response body once and folds any `{ error: string }`
// field into the message so toasts show the server's reason instead of a
// generic "failed: 400".
export async function unwrap<
  T extends {
    ok: boolean;
    status: number;
    json: () => Promise<unknown>;
    url: string;
  },
>(resPromise: Promise<T>): Promise<Awaited<ReturnType<T["json"]>>> {
  const res = await resPromise;
  if (!res.ok) {
    const body = await res.json().catch(() => undefined);
    const detail =
      body &&
      typeof body === "object" &&
      "error" in body &&
      typeof (body as { error: unknown }).error === "string"
        ? `: ${(body as { error: string }).error}`
        : "";
    throw new ApiError(
      `API ${pathOf(res.url)} failed: ${res.status}${detail}`,
      res.status,
      body,
    );
  }
  return (await res.json()) as Awaited<ReturnType<T["json"]>>;
}

// `res.url` is "" or relative when API_BASE is "" (browser, same-origin).
// `new URL("")` throws — fall back to the raw string in that case so the
// real error isn't masked by a URL parse failure.
function pathOf(url: string): string {
  if (!url) return "(unknown)";
  try {
    return new URL(url, "http://x").pathname;
  } catch {
    return url;
  }
}
