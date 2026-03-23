import pino from "pino";
import PinoPretty from "pino-pretty";

const isDev = process.env.NODE_ENV !== "production";

/** Only scalar values — matches the existing logger API contract */
export type LogAttributes = Record<string, string | number | boolean>;

const level = process.env.LOG_LEVEL ?? (isDev ? "debug" : "info");

// In dev, use pino-pretty as a sync stream (not a worker transport) so that
// the main thread is not blocked and OTel can emit in the same context.
// PinoInstrumentation (registered in instrumentation.ts) intercepts pino calls
// and emits OTel log records automatically, including trace_id/span_id correlation.
const pinoInstance = isDev
  ? pino({ level }, PinoPretty({ colorize: true, sync: true }))
  : pino({ level });

export const logger = {
  debug: (message: string, attributes?: LogAttributes) => {
    attributes
      ? pinoInstance.debug(attributes, message)
      : pinoInstance.debug(message);
  },
  info: (message: string, attributes?: LogAttributes) => {
    attributes
      ? pinoInstance.info(attributes, message)
      : pinoInstance.info(message);
  },
  warn: (message: string, attributes?: LogAttributes) => {
    attributes
      ? pinoInstance.warn(attributes, message)
      : pinoInstance.warn(message);
  },
  error: (message: string, attributes?: LogAttributes) => {
    attributes
      ? pinoInstance.error(attributes, message)
      : pinoInstance.error(message);
  },
};
