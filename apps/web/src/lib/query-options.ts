import type { ChallengeListInput } from "@kubeasy/api-schemas/challenges";
import { queryOptions } from "@tanstack/react-query";
import { fetchBlogPostDetailFn, fetchBlogPostsFn } from "./blog.functions";
import { rpc, unwrap } from "./rpc";

// --- Challenges ---

export function challengeListOptions(params?: ChallengeListInput) {
  // Strip undefined values so challengeListOptions() and challengeListOptions({ difficulty: undefined, ... })
  // produce the same query key — avoids SSG cache miss on hydration.
  const normalized = params
    ? Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined),
      )
    : {};
  return queryOptions({
    queryKey: ["challenges", "list", normalized],
    queryFn: () =>
      unwrap(
        rpc.challenges.$get({
          query: {
            difficulty: params?.difficulty,
            type: params?.type,
            theme: params?.theme,
            search: params?.search,
            showCompleted:
              params?.showCompleted === false ? "false" : undefined,
          },
        }),
      ),
    staleTime: 5 * 60 * 1000,
  });
}

export function challengeDetailOptions(slug: string) {
  return queryOptions({
    queryKey: ["challenges", "detail", slug],
    queryFn: () => unwrap(rpc.challenges[":slug"].$get({ param: { slug } })),
    staleTime: 60 * 60 * 1000, // 1h — matches ISR revalidation window
  });
}

export function challengeObjectivesOptions(slug: string) {
  return queryOptions({
    queryKey: ["challenges", "objectives", slug],
    queryFn: () =>
      unwrap(rpc.challenges[":slug"].objectives.$get({ param: { slug } })),
    staleTime: 60 * 60 * 1000,
  });
}

// --- Registry ---

export function registryMetaOptions() {
  return queryOptions({
    queryKey: ["registry", "meta"],
    queryFn: () => unwrap(rpc.challenges.meta.$get()),
    staleTime: 60 * 60 * 1000, // 1h — themes/types change rarely
  });
}

// --- User stats (auth-required) ---

export function userStatsOptions() {
  return queryOptions({
    queryKey: ["user", "stats"],
    queryFn: () =>
      Promise.all([
        unwrap(rpc.user.xp.$get()),
        unwrap(rpc.user.streak.$get()),
      ]).then(([xp, streak]) => ({ xp, streak })),
  });
}

// --- Progress (auth-required) ---

export function completionOptions(params?: {
  splitByTheme?: boolean;
  themeSlug?: string;
}) {
  return queryOptions({
    queryKey: ["progress", "completion", params ?? {}],
    queryFn: () =>
      unwrap(
        rpc.progress.completion.$get({
          query: {
            splitByTheme: params?.splitByTheme ? "true" : undefined,
            themeSlug: params?.themeSlug,
          },
        }),
      ),
  });
}

export function challengeStatusOptions(slug: string) {
  return queryOptions({
    queryKey: ["progress", "status", slug],
    queryFn: () => unwrap(rpc.progress[":slug"].$get({ param: { slug } })),
  });
}

// --- Submissions ---

export function submissionsOptions(slug: string) {
  return queryOptions({
    queryKey: ["submissions", slug],
    queryFn: () => unwrap(rpc.submissions[":slug"].$get({ param: { slug } })),
  });
}

export function latestValidationOptions(slug: string) {
  return queryOptions({
    queryKey: ["submissions", "latest", slug],
    queryFn: () =>
      unwrap(rpc.submissions[":slug"].latest.$get({ param: { slug } })),
  });
}

// --- User (auth-required) ---

export function userXpOptions() {
  return queryOptions({
    queryKey: ["user", "xp"],
    queryFn: () => unwrap(rpc.user.xp.$get()),
  });
}

export function userStreakOptions() {
  return queryOptions({
    queryKey: ["user", "streak"],
    queryFn: () => unwrap(rpc.user.streak.$get()),
  });
}

// --- XP ---

export function xpTransactionsOptions() {
  return queryOptions({
    queryKey: ["xp", "transactions"],
    queryFn: () => unwrap(rpc.xp.history.$get()),
  });
}

// --- Blog ---

export function blogListOptions() {
  return queryOptions({
    queryKey: ["blog", "list"],
    queryFn: () => fetchBlogPostsFn(),
    staleTime: 10 * 60 * 1000, // 10 min — blog content changes infrequently
  });
}

export function blogPostDetailOptions(slug: string) {
  return queryOptions({
    queryKey: ["blog", "detail", slug],
    queryFn: () => fetchBlogPostDetailFn({ data: slug }),
    staleTime: 10 * 60 * 1000,
  });
}

// --- Admin ---

export function adminChallengesOptions() {
  return queryOptions({
    queryKey: ["admin", "challenges"],
    queryFn: () => unwrap(rpc.admin.challenges.$get()),
  });
}
