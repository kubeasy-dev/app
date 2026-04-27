import { expect, test } from "@playwright/test";

test.describe("Challenge Flow", () => {
  test("classic user flow: view, submit and complete challenge", async ({
    page,
    request,
  }) => {
    const slug = "first-deployment";

    // sessionToken is needed for API calls, we get it from cookies already injected in storageState
    const cookies = await page.context().cookies();
    const sessionToken = cookies.find(
      (c) => c.name === "better-auth.session_token",
    )?.value;

    // 0. Reset progress to ensure a clean state (Idempotency)
    await request.post(`/api/progress/${slug}/reset`, {
      headers: { Cookie: `better-auth.session_token=${sessionToken}` },
    });

    // 1. Go to challenge page
    await page.goto(`/challenges/${slug}`);

    // Wait for auth and loading
    await expect(page.getByTestId("mission-score")).toBeVisible({
      timeout: 10000,
    });

    // Visual Regression Test: The mission card design is critical
    const missionCard = page
      .locator("div")
      .filter({ hasText: /Your Mission/i })
      .first();
    await expect(missionCard).toHaveScreenshot("mission-card-initial.png", {
      mask: [page.getByTestId("mission-score")], // Mask the score as it might change
    });

    // Check initial score (0/3)
    const scoreElement = page.getByTestId("mission-score");
    await expect(scoreElement).toHaveText("0/3");

    // Give some time for SSE to establish connection
    await page.waitForTimeout(2000);

    // 2. Start the challenge (Now dynamic!)
    await request.post(`/api/progress/${slug}/start`, {
      headers: { Cookie: `better-auth.session_token=${sessionToken}` },
    });

    // Wait for UI to reflect "In Progress" state DYNAMICALLY
    const commandBlock = page.locator(".font-mono");
    await expect(commandBlock).toContainText(/submit/i, { timeout: 15000 });

    // 3. Simulate PARTIAL submission (Failing)
    await request.post(`/api/challenges/${slug}/submit`, {
      headers: {
        Cookie: `better-auth.session_token=${sessionToken}`,
        "Content-Type": "application/json",
      },
      data: {
        results: [
          {
            objectiveKey: "pods-ready",
            passed: true,
            message: "Pods are good",
          },
          {
            objectiveKey: "nginx-logs",
            passed: false,
            message: "Logs not found yet",
          },
          {
            objectiveKey: "deployment-available",
            passed: false,
            message: "Waiting for stability",
          },
        ],
      },
    });

    // Verify UI reflects partial success
    await expect(page.getByTestId("objective-pods-ready")).toHaveClass(
      /bg-green-50/,
    );
    await expect(page.getByTestId("objective-nginx-logs")).toHaveClass(
      /bg-red-50/,
    );
    await expect(scoreElement).toHaveText("1/3");

    // 4. Simulate COMPLETE submission (Success)
    await request.post(`/api/challenges/${slug}/submit`, {
      headers: {
        Cookie: `better-auth.session_token=${sessionToken}`,
        "Content-Type": "application/json",
      },
      data: {
        results: [
          {
            objectiveKey: "pods-ready",
            passed: true,
            message: "All pods are running",
          },
          {
            objectiveKey: "nginx-logs",
            passed: true,
            message: "Logs verified",
          },
          {
            objectiveKey: "deployment-available",
            passed: true,
            message: "Deployment is stable",
          },
        ],
      },
    });

    // 5. Verify UI reaction (SSE Invalidation)
    await expect(page.getByTestId("success-message")).toBeVisible({
      timeout: 15000,
    });
    await expect(scoreElement).toHaveText("3/3");

    // 6. Verify history
    const historyButton = page.getByTestId("view-history-button");
    await expect(historyButton).toBeVisible({ timeout: 10000 });
    await historyButton.click();
    await expect(page.getByText("Passed")).toBeVisible();
  });
});
