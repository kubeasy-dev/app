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

// Helper that throws on non-2xx and returns parsed JSON.
// Mirrors what the old `apiFetch` wrapper did so callers stay terse.
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
    throw new Error(`API ${new URL(res.url).pathname} failed: ${res.status}`);
  }
  return (await res.json()) as Awaited<ReturnType<T["json"]>>;
}
