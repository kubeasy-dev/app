/**
 * Helper to pass a readonly const tuple to Drizzle's pgEnum while preserving
 * the literal union type for column inference.
 *
 * Usage:
 *   export const myEnum = pgEnum("my_enum", asDrizzleEnum(myValues));
 */
export function asDrizzleEnum<T extends readonly [string, ...string[]]>(
  values: T,
): [T[number], ...T[number][]] {
  return values as unknown as [T[number], ...T[number][]];
}
