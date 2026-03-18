import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  Outlet,
  ScrollRestoration,
} from "@tanstack/react-router";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Kubeasy - Learn Kubernetes by Doing" },
    ],
    links: [{ rel: "stylesheet", href: "/styles/globals.css" }],
  }),
  component: RootComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Header />
      <main className="pt-32 pb-20">
        <Outlet />
      </main>
      <Footer />
      <ScrollRestoration />
    </QueryClientProvider>
  );
}
