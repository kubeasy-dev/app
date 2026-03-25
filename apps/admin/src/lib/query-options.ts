import { queryOptions } from "@tanstack/react-query";
import type { AdminChallengeListOutput, AdminStatsOutput } from "@kubeasy/api-schemas/challenges";
import { apiFetch } from "./api-client";

export function adminChallengesOptions() {
  return queryOptions({
    queryKey: ["admin", "challenges"],
    queryFn: () => apiFetch<AdminChallengeListOutput>("/admin/challenges"),
  });
}

export function adminChallengesStatsOptions() {
  return queryOptions({
    queryKey: ["admin", "challenges", "stats"],
    queryFn: () => apiFetch<AdminStatsOutput>("/admin/challenges/stats"),
  });
}
