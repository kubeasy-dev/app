/**
 * Server-side structured logging with PostHog via OpenTelemetry
 *
 * Sends logs to PostHog on Vercel deployments (preview + production).
 * Falls back to console.* in local development.
 *
 * Best practices (https://posthog.com/docs/logs/best-practices):
 * - Only bind scalar values (strings, numbers, booleans) as attributes
 * - Use lowercase severityText values (trace, debug, info, warn, error, fatal)
 * - Set resource attributes (service.name, service.version, deployment.environment) once at startup
 * - Set log attributes per event to describe the specific request
 */

import { SeverityNumber } from "@opentelemetry/api-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  BatchLogRecordProcessor,
  LoggerProvider,
} from "@opentelemetry/sdk-logs";

const isVercel = !!process.env.VERCEL;
const posthogKey = process.env.POSTHOG_KEY;

/**
 * OpenTelemetry LoggerProvider — only created on Vercel deployments
 * Exported for use in instrumentation.ts (register + forceFlush)
 */
export const loggerProvider =
  isVercel && posthogKey
    ? new LoggerProvider({
        resource: resourceFromAttributes({
          "service.name": "kubeasy",
          "service.version": process.env.VERCEL_GIT_COMMIT_SHA ?? "unknown",
          "deployment.environment": process.env.VERCEL_ENV ?? "unknown",
        }),
        processors: [
          new BatchLogRecordProcessor(
            new OTLPLogExporter({
              url: "https://eu.i.posthog.com/i/v1/logs",
              headers: {
                Authorization: `Bearer ${posthogKey}`,
                "Content-Type": "application/json",
              },
            }),
          ),
        ],
      })
    : null;

const otelLogger = loggerProvider?.getLogger("kubeasy");

/** Only scalar values — no objects, arrays, or undefined (per OTel spec & PostHog best practices) */
export type LogAttributes = Record<string, string | number | boolean>;

/**
 * Strip undefined values from an attributes object so only OTel-compatible
 * scalar values remain.
 */
function cleanAttributes(
  attrs?: Record<string, string | number | boolean | undefined>,
): LogAttributes | undefined {
  if (!attrs) return undefined;
  const cleaned: LogAttributes = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

function emit(
  severityNumber: SeverityNumber,
  severityText: string,
  message: string,
  attributes?: Record<string, string | number | boolean | undefined>,
) {
  const cleaned = cleanAttributes(attributes);

  if (!otelLogger) {
    // Fallback to console in local dev
    const consoleFn =
      severityNumber >= SeverityNumber.ERROR
        ? console.error
        : severityNumber >= SeverityNumber.WARN
          ? console.warn
          : severityNumber >= SeverityNumber.INFO
            ? console.info
            : console.debug;
    if (cleaned) {
      consoleFn(message, cleaned);
    } else {
      consoleFn(message);
    }
    return;
  }

  otelLogger.emit({
    body: message,
    severityNumber,
    severityText,
    ...(cleaned && { attributes: cleaned }),
  });
}

export const logger = {
  debug: (
    message: string,
    attributes?: Record<string, string | number | boolean | undefined>,
  ) => emit(SeverityNumber.DEBUG, "debug", message, attributes),
  info: (
    message: string,
    attributes?: Record<string, string | number | boolean | undefined>,
  ) => emit(SeverityNumber.INFO, "info", message, attributes),
  warn: (
    message: string,
    attributes?: Record<string, string | number | boolean | undefined>,
  ) => emit(SeverityNumber.WARN, "warn", message, attributes),
  error: (
    message: string,
    attributes?: Record<string, string | number | boolean | undefined>,
  ) => emit(SeverityNumber.ERROR, "error", message, attributes),
};
