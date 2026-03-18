import { describe, it } from "vitest";

describe("POST /api/challenges/:slug/submit", () => {
  it.todo("returns 422 for missing required objectives (API-05)");
  it.todo("returns 422 for unknown objectives submitted (API-05)");
  it.todo("returns 401 without authentication");
  it.todo("returns 404 for non-existent challenge");
  it.todo("returns 409 for already completed challenge");
  it.todo("stores submission even when validation fails");
  it.todo("returns failure response with failed objectives list");
  it.todo("triggers XP distribution on all-pass submission (API-05)");
  it.todo("handles race condition with atomic progress update");
  it.todo("records first-challenge bonus XP when applicable");
  it.todo("records streak bonus XP when applicable");
});
