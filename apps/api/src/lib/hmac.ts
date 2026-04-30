import { createHmac, timingSafeEqual } from "node:crypto";

export function computeSubmitSignature(
  nonce: string,
  runToken: string,
  timestamp: string,
  rawBody: string,
): string {
  return createHmac("sha256", nonce)
    .update(`${runToken}\n${timestamp}\n${rawBody}`)
    .digest("hex");
}

export function verifySubmitSignature(
  nonce: string,
  runToken: string,
  timestamp: string,
  rawBody: string,
  providedSignature: string,
): boolean {
  const expected = computeSubmitSignature(nonce, runToken, timestamp, rawBody);
  if (expected.length !== providedSignature.length) return false;
  try {
    return timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(providedSignature, "hex"),
    );
  } catch {
    return false;
  }
}
