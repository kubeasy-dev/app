import { describe, it } from "vitest";

describe("apiKeyMiddleware", () => {
  it.todo("returns 401 when Authorization header is missing (AUTH-05)");
  it.todo(
    "returns 401 when Authorization header is not Bearer scheme (AUTH-05)",
  );
  it.todo("returns 401 when API key is invalid (AUTH-05)");
  it.todo(
    "returns 401 when API key is valid but user not found in DB (AUTH-05)",
  );
  it.todo("sets user in c.var when API key is valid and user exists (AUTH-05)");
  it.todo("sets session to null (API key auth has no session) (AUTH-05)");
});

describe("CLI route wiring", () => {
  it.todo("apiKeyMiddleware is applied before CLI route handlers (AUTH-05)");
  it.todo(
    "POST /api/cli/challenges/:slug/submit requires valid API key (AUTH-05)",
  );
});
