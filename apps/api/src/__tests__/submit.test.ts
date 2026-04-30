import { describe, it } from "vitest";

describe("POST /api/challenges/:slug/start", () => {
  it.todo("returns 401 without authentication");
  it.todo("returns 426 when CLI version is below MIN_CLI_VERSION");
  it.todo("returns 404 for non-existent challenge");
  it.todo("returns runToken + nonce + startedAt + expiresAt for a valid call");
  it.todo("invalidates previous run token when a new one is issued");
  it.todo("rate-limits start calls per user");
});

describe("POST /api/challenges/:slug/submit", () => {
  it.todo("returns 401 without authentication");
  it.todo("returns 400 when X-Kubeasy-CLI-Version header is missing");
  it.todo("returns 426 when CLI version is below MIN_CLI_VERSION");
  it.todo(
    "returns 400 when run token / signature / timestamp headers are missing",
  );
  it.todo("returns 401 when run token is unknown or expired");
  it.todo("returns 403 when run token belongs to another user or slug");
  it.todo("returns 401 when HMAC signature does not match raw body");
  it.todo("returns 400 when timestamp skew is too large");
  it.todo("returns 429 when per-(user,slug) cooldown is hit");
  it.todo("returns 429 when daily cap is reached");
  it.todo("returns 404 for non-existent challenge");
  it.todo("returns 409 for already completed challenge");
  it.todo("stores submission even when validation fails");
  it.todo("returns failure response with failed objectives list");
  it.todo("triggers XP distribution on all-pass submission");
  it.todo("revokes the run token after a successful completion");
  it.todo("handles race condition with atomic progress update");
  it.todo("records first-challenge bonus XP when applicable");
  it.todo("records streak bonus XP when applicable");
});
