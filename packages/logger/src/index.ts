import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

/** Only scalar values — matches the existing logger API contract */
export type LogAttributes = Record<string, string | number | boolean>;

const pinoInstance = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? "debug" : "info"),
  transport: isDev
    ? { target: "pino-pretty", options: { colorize: true } }
    : undefined,
});

export const logger = {
  debug: (message: string, attributes?: LogAttributes) =>
    attributes
      ? pinoInstance.debug(attributes, message)
      : pinoInstance.debug(message),
  info: (message: string, attributes?: LogAttributes) =>
    attributes
      ? pinoInstance.info(attributes, message)
      : pinoInstance.info(message),
  warn: (message: string, attributes?: LogAttributes) =>
    attributes
      ? pinoInstance.warn(attributes, message)
      : pinoInstance.warn(message),
  error: (message: string, attributes?: LogAttributes) =>
    attributes
      ? pinoInstance.error(attributes, message)
      : pinoInstance.error(message),
};
