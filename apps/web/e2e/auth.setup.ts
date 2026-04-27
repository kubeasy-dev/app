import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test as setup } from "@playwright/test";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authFile = path.join(__dirname, ".auth/user.json");

setup("authenticate", async () => {
  console.log("Setting up test authentication...");

  // Execute our existing script from the API package
  // We use execSync to ensure it's done before tests start
  const apiDir = path.join(__dirname, "../../../apps/api");

  try {
    execSync("pnpm tsx --env-file=.env scripts/get-fresh-user-cookies.ts", {
      cwd: apiDir,
      stdio: "inherit",
    });

    // The script saves to apps/web/e2e/.auth/fresh-user.json
    // We'll copy it to the expected authFile
    const generatedFile = path.join(__dirname, ".auth/fresh-user.json");
    if (fs.existsSync(generatedFile)) {
      fs.copyFileSync(generatedFile, authFile);
    }

    console.log("Authentication setup complete.");
  } catch (error) {
    console.error("Failed to setup authentication:", error);
    throw error;
  }
});
