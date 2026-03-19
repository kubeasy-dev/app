export const queryKeys = {
  submissions: {
    latest: (slug: string) => ["submissions", "latest", slug] as const,
  },
  user: {
    xp: () => ["user", "xp"] as const,
  },
  onboarding: () => ["onboarding"] as const,
} as const;
