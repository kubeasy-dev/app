import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { generateCliApiDocument, generateSyncApiDocument } from "@/lib/openapi";

const __dirname = dirname(fileURLToPath(import.meta.url));

const cliDoc = generateCliApiDocument();
const cliOutputPath = resolve(__dirname, "..", "openapi.json");
writeFileSync(cliOutputPath, JSON.stringify(cliDoc, null, 2));
console.log(`CLI OpenAPI spec written to ${cliOutputPath}`);

const syncDoc = generateSyncApiDocument();
const syncOutputPath = resolve(__dirname, "..", "openapi-sync.json");
writeFileSync(syncOutputPath, JSON.stringify(syncDoc, null, 2));
console.log(`Sync OpenAPI spec written to ${syncOutputPath}`);
