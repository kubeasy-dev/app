import { z } from "zod";

export const ThemeSchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  logo: z.string().nullable(),
});
export type Theme = z.infer<typeof ThemeSchema>;

export const ThemeListOutputSchema = z.array(ThemeSchema);
export type ThemeListOutput = z.infer<typeof ThemeListOutputSchema>;

export const ThemeGetInputSchema = z.object({
  slug: z.string(),
});
export type ThemeGetInput = z.infer<typeof ThemeGetInputSchema>;
