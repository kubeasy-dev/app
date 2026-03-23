# packages/logger — CLAUDE.md

Shared structured logger for Kubeasy backend services.

## Purpose

Provides a single, pre-configured `logger` instance backed by **Pino** with **OpenTelemetry** log bridge support. All server-side code should use this instead of `console.*`.

## Usage

```typescript
import { logger } from "@kubeasy/logger";

logger.info("Server started", { port: 3001 });
logger.warn("Redis not configured");
logger.error("Operation failed", { error: String(err) });
logger.debug("Detailed trace", { key: "value" });
```

**Server-side only** — do not import in browser/client code.

## Behavior by Environment

| Environment | Output |
|---|---|
| Development (local) | Pretty-printed console output via `pino-pretty` |
| Production (`VERCEL=true`) | JSON logs sent via OpenTelemetry OTLP (to PostHog) |

## Exports

```
@kubeasy/logger   # Single default export: logger instance
```

## Commands

```bash
pnpm typecheck   # Type-check this package
```

## Dependencies

| Package | Role |
|---|---|
| `pino` | Core structured logger |
| `pino-pretty` | Human-readable formatting for dev |
| `@opentelemetry/api-logs` | OTel log bridge (forwards logs to OTLP) |

**Peer dependency**: `@opentelemetry/api >=1.3.0 <2.0.0` — must be provided by the consuming app (both `apps/web` and `apps/api` already include it).

## Key Rules

- Do not use `console.log/warn/error` in server code — use `logger` instead.
- No build step: apps import TypeScript source directly.
- Keep this package minimal — no business logic, just the logger configuration.
