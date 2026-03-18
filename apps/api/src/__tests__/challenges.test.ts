import { describe, it } from "vitest";

describe("GET /api/challenges", () => {
  it.todo("returns challenge list with correct JSON shape (API-02)");
  it.todo("filters by difficulty query param");
  it.todo("filters by theme query param");
  it.todo("filters by type query param");
  it.todo("filters by search query param (ILIKE)");
  it.todo("excludes completed challenges when showCompleted=false");
});

describe("GET /api/challenges/:slug", () => {
  it.todo("returns challenge detail for valid slug");
  it.todo("returns null for unavailable challenge");
  it.todo("returns null for non-existent slug");
});

describe("GET /api/challenges/:slug/objectives", () => {
  it.todo("returns objectives ordered by displayOrder");
  it.todo("returns empty array for non-existent challenge");
});
