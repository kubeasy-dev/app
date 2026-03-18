import { describe, it } from "vitest";

describe("sessionMiddleware", () => {
  it.todo("sets user and session from valid auth cookie");
  it.todo("sets user and session to null when no cookie present");
});

describe("requireAuth", () => {
  it.todo("returns 401 when no session exists (API-06)");
  it.todo("allows request through when session exists");
});
