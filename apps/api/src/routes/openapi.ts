import { Hono } from "hono";
import { generateSyncApiDocument } from "../lib/openapi";

const openapi = new Hono();

openapi.get("/sync.json", (c) => {
  return c.json(generateSyncApiDocument());
});

export { openapi };
