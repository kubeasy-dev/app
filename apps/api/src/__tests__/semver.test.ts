import { describe, expect, it } from "vitest";
import { compareSemver, isAtLeast } from "../lib/semver";

describe("compareSemver", () => {
  it("returns 0 for equal versions", () => {
    expect(compareSemver("1.2.3", "1.2.3")).toBe(0);
  });

  it("compares major, minor, patch", () => {
    expect(compareSemver("2.0.0", "1.9.9")).toBeGreaterThan(0);
    expect(compareSemver("1.2.0", "1.3.0")).toBeLessThan(0);
    expect(compareSemver("1.2.4", "1.2.3")).toBeGreaterThan(0);
  });

  it("ignores pre-release / build suffixes", () => {
    expect(compareSemver("1.2.3-alpha.1", "1.2.3")).toBe(0);
    expect(compareSemver("1.2.3+build.5", "1.2.3")).toBe(0);
  });

  it("returns NaN for invalid input", () => {
    expect(Number.isNaN(compareSemver("foo", "1.2.3"))).toBe(true);
    expect(Number.isNaN(compareSemver("1.2.3", "bar"))).toBe(true);
  });
});

describe("isAtLeast", () => {
  it("true for equal", () => {
    expect(isAtLeast("1.2.3", "1.2.3")).toBe(true);
  });

  it("true for greater", () => {
    expect(isAtLeast("1.3.0", "1.2.3")).toBe(true);
  });

  it("false for lower", () => {
    expect(isAtLeast("1.2.2", "1.2.3")).toBe(false);
  });

  it("false for invalid input", () => {
    expect(isAtLeast("not-a-version", "1.0.0")).toBe(false);
  });
});
