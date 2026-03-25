import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig(async () => {
  return {
    server: { port: 3000 },
    resolve: {
      alias: { "@": new URL("./src", import.meta.url).pathname },
    },
    plugins: [
      tanstackStart({
        server: { entry: "./src/server.tsx" },
        router: { entry: "./lib/router" },
        prerender: {
          enabled: true,
          crawlLinks: true,
          autoStaticPathsDiscovery: false,
          concurrency: 4,
          failOnError: false,
        },
        pages: [
          { path: "/", prerender: { enabled: true } },
          { path: "/blog", prerender: { enabled: true } },
          { path: "/challenges", prerender: { enabled: true } },
        ],
      }),
      nitro({ preset: "node-server", noExternals: ["tslib"] }),
      viteReact(),
      tailwindcss(),
    ],
  };
});
