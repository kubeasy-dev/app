import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { generateOpenApiDocument } from "@/lib/openapi";

const __dirname = dirname(fileURLToPath(import.meta.url));
const doc = generateOpenApiDocument();
const outputPath = resolve(__dirname, "..", "openapi.json");

writeFileSync(outputPath, JSON.stringify(doc, null, 2));
console.log(`OpenAPI spec written to ${outputPath}`);
