import { z } from "zod";

// ---------- User ----------

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  role: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type User = z.infer<typeof UserSchema>;

// ---------- Session ----------

export const SessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  expiresAt: z.coerce.date(),
  token: z.string(),
});
export type Session = z.infer<typeof SessionSchema>;

// ---------- Error Response ----------

export const ErrorResponseSchema = z.object({
  error: z.string(),
  details: z.string().optional(),
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// ---------- Admin User ----------

export const AdminUserItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  image: z.string().nullable(),
  role: z.string().nullable(),
  createdAt: z.coerce.date(),
  banned: z.boolean().nullable(),
  banReason: z.string().nullable(),
  completedChallenges: z.number().int(),
  totalXp: z.number().int(),
});
export type AdminUserItem = z.infer<typeof AdminUserItemSchema>;

export const AdminUserListOutputSchema = z.object({
  users: z.array(AdminUserItemSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});
export type AdminUserListOutput = z.infer<typeof AdminUserListOutputSchema>;

export const AdminUserStatsOutputSchema = z.object({
  total: z.number().int(),
  active: z.number().int(),
  banned: z.number().int(),
  admins: z.number().int(),
});
export type AdminUserStatsOutput = z.infer<typeof AdminUserStatsOutputSchema>;
