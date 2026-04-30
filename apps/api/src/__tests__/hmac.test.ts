import { describe, expect, it } from "vitest";
import { computeSubmitSignature, verifySubmitSignature } from "../lib/hmac";

describe("computeSubmitSignature", () => {
  it("is deterministic for the same inputs", () => {
    const a = computeSubmitSignature("nonce", "tok", "1700000000000", "{}");
    const b = computeSubmitSignature("nonce", "tok", "1700000000000", "{}");
    expect(a).toBe(b);
  });

  it("differs when any input changes", () => {
    const base = computeSubmitSignature("n", "tok", "1", "{}");
    expect(computeSubmitSignature("n2", "tok", "1", "{}")).not.toBe(base);
    expect(computeSubmitSignature("n", "tok2", "1", "{}")).not.toBe(base);
    expect(computeSubmitSignature("n", "tok", "2", "{}")).not.toBe(base);
    expect(computeSubmitSignature("n", "tok", "1", "{a:1}")).not.toBe(base);
  });
});

describe("verifySubmitSignature", () => {
  it("returns true for a valid signature", () => {
    const sig = computeSubmitSignature("nonce", "tok", "1", "body");
    expect(verifySubmitSignature("nonce", "tok", "1", "body", sig)).toBe(true);
  });

  it("returns false for a tampered body", () => {
    const sig = computeSubmitSignature("nonce", "tok", "1", "body");
    expect(verifySubmitSignature("nonce", "tok", "1", "tampered", sig)).toBe(
      false,
    );
  });

  it("returns false for a wrong nonce", () => {
    const sig = computeSubmitSignature("nonce", "tok", "1", "body");
    expect(verifySubmitSignature("other", "tok", "1", "body", sig)).toBe(false);
  });

  it("returns false for malformed signature input", () => {
    expect(
      verifySubmitSignature("nonce", "tok", "1", "body", "not-a-hex-string"),
    ).toBe(false);
  });
});
