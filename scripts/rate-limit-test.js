#!/usr/bin/env node

/**
 * Rate limit verification script (Success Criteria #4).
 * Sends 100 requests in 10 seconds to the submit endpoint.
 * Expects HTTP 429 responses after the threshold (10 req/10s) is exceeded.
 *
 * Usage: node scripts/rate-limit-test.js [base_url]
 * Default base_url: http://localhost:3001
 */

const BASE_URL = process.argv[2] || "http://localhost:3001";
const ENDPOINT = `${BASE_URL}/api/challenges/test-challenge/submit`;
const TOTAL_REQUESTS = 100;
const DURATION_MS = 10_000;
const INTERVAL_MS = DURATION_MS / TOTAL_REQUESTS; // 100ms between requests

async function main() {
  let count429 = 0;
  let count2xx = 0;
  let countOther = 0;
  const startTime = Date.now();

  console.log(
    `Sending ${TOTAL_REQUESTS} requests over ${DURATION_MS}ms to ${ENDPOINT}`,
  );

  for (let i = 0; i < TOTAL_REQUESTS; i++) {
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          results: [{ objectiveKey: "test", passed: true }],
        }),
      });

      if (res.status === 429) count429++;
      else if (res.status >= 200 && res.status < 300) count2xx++;
      else countOther++;
    } catch (_err) {
      countOther++;
    }

    if (i < TOTAL_REQUESTS - 1) {
      await new Promise((r) => setTimeout(r, INTERVAL_MS));
    }
  }

  const elapsed = Date.now() - startTime;
  console.log(`\nResults (${elapsed}ms elapsed):`);
  console.log(`  2xx responses: ${count2xx}`);
  console.log(`  429 responses: ${count429}`);
  console.log(`  Other/errors:  ${countOther}`);

  if (count429 > 0) {
    console.log("\nPASS: Rate limiting is working (received 429 responses)");
    process.exit(0);
  } else {
    console.log(
      "\nFAIL: No 429 responses received - rate limiting may not be active",
    );
    process.exit(1);
  }
}

main();
