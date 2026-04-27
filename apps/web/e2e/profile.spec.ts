import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authStatePath = path.join(__dirname, ".auth/fresh-user.json");

// Run tests in this file sequentially because they share the same user state
test.describe.configure({ mode: "serial" });

test.describe("Profile Page", () => {
  test.beforeEach(async ({ context }) => {
    if (fs.existsSync(authStatePath)) {
      const { cookies } = JSON.parse(fs.readFileSync(authStatePath, "utf-8"));
      await context.addCookies(
        cookies.map((c) => ({
          name: c.name,
          value: c.value,
          url: "http://localhost:3024",
        })),
      );
    }
  });

  async function skipOnboardingIfNeeded(_page, request, sessionToken) {
    // Skip onboarding via API to avoid redirects and save time
    await request.post("/api/onboarding/skip", {
      headers: { Cookie: `better-auth.session_token=${sessionToken}` },
    });
  }

  test("should update user name dynamically", async ({ page, request }) => {
    test.setTimeout(60000);
    const authFile = JSON.parse(fs.readFileSync(authStatePath, "utf-8"));
    const sessionToken = authFile.cookies.find(
      (c) => c.name === "better-auth.session_token",
    )?.value;

    await skipOnboardingIfNeeded(page, request, sessionToken);
    await page.goto("/profile");
    await expect(page.getByText(/Loading/i)).not.toBeVisible({
      timeout: 15000,
    });

    const newFirstName = "John";
    const newLastName = "Doe";
    const expectedFullName = `${newFirstName} ${newLastName}`;

    await page.getByTestId("first-name-input").fill(newFirstName);
    await page.getByTestId("last-name-input").fill(newLastName);
    await page.getByRole("button", { name: /Save Changes/i }).click();

    // Verify dynamic update (header should change)
    await expect(page.getByTestId("profile-user-name")).toHaveText(
      expectedFullName,
      { timeout: 15000 },
    );

    // Verify persistence after reload
    await page.reload();
    await expect(page.getByTestId("first-name-input")).toHaveValue(
      newFirstName,
    );
  });

  test("should create, use and delete API tokens", async ({
    page,
    request,
  }) => {
    test.setTimeout(60000);
    const authFile = JSON.parse(fs.readFileSync(authStatePath, "utf-8"));
    const sessionToken = authFile.cookies.find(
      (c) => c.name === "better-auth.session_token",
    )?.value;

    await skipOnboardingIfNeeded(page, request, sessionToken);
    await page.goto("/profile");
    await expect(page.getByText(/Loading/i)).not.toBeVisible({
      timeout: 15000,
    });

    const tokenName = `token-${Math.random().toString(36).substring(7)}`;

    // 1. Create Token
    await page.getByTestId("new-token-button").click();
    const input = page.getByTestId("new-token-name-input");
    await expect(input).toBeVisible();
    await input.fill(tokenName);
    await page.getByTestId("create-token-confirm-button").click();

    // 2. Capture and Verify Token Value
    const tokenValueElement = page.getByTestId("created-token-value");
    await expect(tokenValueElement).toBeVisible({ timeout: 10000 });
    const tokenValue = await tokenValueElement.innerText();
    expect(tokenValue.length).toBeGreaterThan(20);

    // 3. Test the token via direct API call
    const apiResponse = await request.get("/api/user/xp", {
      headers: { Authorization: `Bearer ${tokenValue}` },
    });
    expect(apiResponse.ok()).toBeTruthy();

    // 4. Close and verify gone
    await page.getByTestId("token-saved-button").click();
    await expect(tokenValueElement).not.toBeVisible();

    // 5. Verify in list
    await expect(page.getByTestId(`api-token-item-${tokenName}`)).toBeVisible();

    // 6. Delete
    await page.getByTestId(`delete-token-button-${tokenName}`).click();
    const confirmBtn = page.getByTestId("confirm-delete-token-button");
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();
    await expect(
      page.getByTestId(`api-token-item-${tokenName}`),
    ).not.toBeVisible();

    // 7. Verify invalid
    const invalidRes = await request.get("/api/user/xp", {
      headers: { Authorization: `Bearer ${tokenValue}` },
    });
    expect(invalidRes.status()).toBe(401);
  });

  test("should reset all user progress", async ({ page, request }) => {
    test.setTimeout(60000);
    const slug = "first-deployment";
    const authFile = JSON.parse(fs.readFileSync(authStatePath, "utf-8"));
    const sessionToken = authFile.cookies.find(
      (c) => c.name === "better-auth.session_token",
    )?.value;

    await skipOnboardingIfNeeded(page, request, sessionToken);

    // 1. Setup: Progress
    await request.post(`/api/progress/${slug}/start`, {
      headers: { Cookie: `better-auth.session_token=${sessionToken}` },
    });
    await request.post(`/api/challenges/${slug}/submit`, {
      headers: {
        Cookie: `better-auth.session_token=${sessionToken}`,
        "Content-Type": "application/json",
      },
      data: {
        results: [
          { objectiveKey: "pods-ready", passed: true, message: "OK" },
          { objectiveKey: "nginx-logs", passed: true, message: "OK" },
          { objectiveKey: "deployment-available", passed: true, message: "OK" },
        ],
      },
    });

    // 2. Perform Reset
    await page.goto("/profile");
    await expect(page.getByText(/Loading/i)).not.toBeVisible({
      timeout: 15000,
    });

    await page.getByTestId("reset-progress-button").click();
    const confirmResetBtn = page.getByTestId("confirm-reset-progress-button");
    await expect(confirmResetBtn).toBeVisible();
    await confirmResetBtn.click();

    // Wait for modal to close (proves onSuccess was called)
    await expect(confirmResetBtn).not.toBeVisible({ timeout: 10000 });

    // 3. Verify reset on dashboard
    await page.goto("/dashboard");
    await expect(page.getByTestId("total-xp")).toHaveText("0", {
      timeout: 15000,
    });
    await expect(page.getByText(/No activity yet/i)).toBeVisible();
  });
});
