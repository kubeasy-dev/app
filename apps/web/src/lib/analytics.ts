/**
 * PostHog analytics tracking utilities
 *
 * This file provides type-safe wrappers around PostHog event tracking
 * to ensure consistent event naming and properties across the application.
 */

import posthog from "posthog-js";

/**
 * Check if PostHog is initialized (regardless of opt-out status)
 * Used for operations that should work even when user has opted out (e.g., reset on logout)
 * @returns true if PostHog is loaded and available
 */
function isPostHogInitialized(): boolean {
  try {
    return posthog && typeof posthog.reset === "function";
  } catch {
    return false;
  }
}

/**
 * Check if PostHog is ready and enabled for tracking
 * @returns true if PostHog is initialized and not opted out
 */
function isPostHogReady(): boolean {
  try {
    return isPostHogInitialized() && !posthog.has_opted_out_capturing();
  } catch {
    return false;
  }
}

/**
 * Safe wrapper for PostHog capture calls with error handling
 * @param eventName - The name of the event to track
 * @param properties - Event properties
 * @param options - PostHog options (e.g., transport: "sendBeacon")
 */
function safeCapture(
  eventName: string,
  properties?: Record<string, unknown>,
  options?: Record<string, unknown>,
): void {
  if (!isPostHogReady()) {
    if (process.env.NODE_ENV === "development") {
      console.info(
        "[PostHog] Event capture skipped (disabled)",
        eventName,
        properties,
      );
    }
    return;
  }

  try {
    posthog.capture(eventName, properties, options);
  } catch (error) {
    console.error("[PostHog] Failed to capture event", eventName, error);
  }
}

/**
 * Track API token creation event
 * Note: User is already identified via PostHog session, no userId needed
 */
export function trackApiTokenCreated() {
  safeCapture("api_token_created");
}

/**
 * Identify a user in PostHog
 * This should be called after successful authentication
 * @param userId - The unique user ID
 * @param properties - Additional user properties
 */
export function identifyUser(
  userId: string,
  properties?: {
    email?: string;
    name?: string;
    provider?: string;
  },
) {
  if (!isPostHogReady()) {
    if (process.env.NODE_ENV === "development") {
      console.info("[PostHog] User identification skipped (disabled)");
    }
    return;
  }

  try {
    posthog.identify(userId, properties);
  } catch (error) {
    console.error("[PostHog] Failed to identify user", error);
  }
}

/**
 * Reset PostHog state (call on logout)
 * Note: Uses isPostHogInitialized() instead of isPostHogReady() to ensure
 * reset works even when user has opted out of tracking
 */
export function resetAnalytics() {
  if (!isPostHogInitialized()) {
    return;
  }

  try {
    posthog.reset();
  } catch (error) {
    console.error("[PostHog] Failed to reset:", error);
  }
}

/**
 * Track challenge card click event
 * @param challengeSlug - The slug of the challenge clicked
 * @param difficulty - The difficulty level of the challenge
 * @param fromPage - The page where the click occurred (e.g., "homepage", "challenges_list")
 */
export function trackChallengeCardClicked(
  challengeSlug: string,
  difficulty: string,
  fromPage: string,
) {
  safeCapture("challenge_card_clicked", {
    challengeSlug,
    difficulty,
    fromPage,
  });
}

/**
 * Track CTA button click event
 * @param ctaText - The text of the CTA button
 * @param ctaLocation - Where the CTA is located (e.g., "hero", "footer", "navbar")
 * @param targetUrl - The URL the CTA points to
 */
export function trackCtaClicked(
  ctaText: string,
  ctaLocation: string,
  targetUrl: string,
) {
  safeCapture("cta_clicked", {
    ctaText,
    ctaLocation,
    targetUrl,
  });
}

/**
 * Track CLI command copied event
 * @param command - The command that was copied
 * @param location - Where the copy occurred (e.g., "get_started", "challenge_page")
 * @param stepNumber - Optional step number in a tutorial flow
 */
export function trackCommandCopied(
  command: string,
  location: string,
  stepNumber?: number,
) {
  safeCapture("command_copied", {
    command,
    location,
    ...(stepNumber !== undefined && { stepNumber }),
  });
}

/**
 * Track API token copied event
 * @param tokenName - The name of the token that was copied
 */
export function trackApiTokenCopied(tokenName: string) {
  safeCapture("api_token_copied", {
    tokenName,
  });
}

/**
 * Sanitize URL by removing sensitive query parameters
 * @param url - The URL to sanitize
 * @returns Sanitized URL without sensitive parameters
 */
function sanitizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const sensitiveParams = [
      "token",
      "api_key",
      "apikey",
      "key",
      "secret",
      "password",
      "auth",
      "session",
      "sid",
      "access_token",
      "refresh_token",
    ];

    for (const param of sensitiveParams) {
      if (urlObj.searchParams.has(param)) {
        urlObj.searchParams.set(param, "[REDACTED]");
      }
    }

    return urlObj.toString();
  } catch {
    // If URL parsing fails, return just the origin or a safe fallback
    return url.split("?")[0] ?? url;
  }
}

/**
 * Track outbound link click event
 * Uses sendBeacon transport to ensure event delivery before navigation
 * @param url - The external URL clicked
 * @param linkType - Type of link (e.g., "github", "docs", "npm")
 * @param location - Where the link is located (e.g., "footer", "header", "cta_section")
 */
export function trackOutboundLinkClicked(
  url: string,
  linkType: "github" | "docs" | "npm" | "twitter" | "other",
  location: string,
) {
  safeCapture(
    "outbound_link_clicked",
    {
      url: sanitizeUrl(url),
      linkType,
      location,
    },
    { transport: "sendBeacon" },
  );
}

/**
 * Track demo step completed event
 * @param stepNumber - The demo step number completed
 */
export function trackDemoStepCompleted(stepNumber: number) {
  safeCapture(`demo_step_${stepNumber}_completed`);
}

/**
 * Track demo session created event
 * Called when a user starts the demo flow
 */
export function trackDemoCreated() {
  safeCapture("demo_created");
}

/**
 * Track demo completed event
 * Called when a user successfully completes the demo
 */
export function trackDemoCompleted() {
  safeCapture("demo_completed");
}

// Onboarding step types
export type OnboardingStep =
  | "welcome"
  | "cli_install"
  | "api_token"
  | "cli_login"
  | "cli_setup"
  | "challenge_start"
  | "challenge_complete";

/**
 * Track onboarding started event
 * Called when a user begins the onboarding flow
 */
export function trackOnboardingStarted() {
  safeCapture("onboarding_started");
}

/**
 * Track onboarding step completed event
 * @param step - The step that was completed
 * @param stepNumber - The step number (1-7)
 */
export function trackOnboardingStepCompleted(
  step: OnboardingStep,
  stepNumber: number,
) {
  safeCapture("onboarding_step_completed", {
    step,
    stepNumber,
  });
}

/**
 * Track onboarding completed event
 * Called when a user successfully completes the entire onboarding
 */
export function trackOnboardingCompleted() {
  safeCapture("onboarding_completed");
}

/**
 * Track onboarding skipped event
 * @param atStep - The step where the user skipped
 * @param stepNumber - The step number where they skipped
 */
export function trackOnboardingSkipped(
  atStep: OnboardingStep,
  stepNumber: number,
) {
  safeCapture("onboarding_skipped", {
    atStep,
    stepNumber,
  });
}
