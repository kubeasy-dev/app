/**
 * Shared OpenAPI helpers used by `describeRoute` calls across route files.
 * Lives here so each route file can stay focused on logic.
 */
import type { OpenAPIV3 } from "openapi-types";

export const sessionOrBearerSecurity: OpenAPIV3.SecurityRequirementObject[] = [
  { SessionAuth: [] },
  { BearerAuth: [] },
];

export const bearerSecurity: OpenAPIV3.SecurityRequirementObject[] = [
  { BearerAuth: [] },
];

export const sessionSecurity: OpenAPIV3.SecurityRequirementObject[] = [
  { SessionAuth: [] },
];

// `[]` allows the route to be called anonymously (CLI optional auth).
export const optionalSessionOrBearerSecurity: OpenAPIV3.SecurityRequirementObject[] =
  [...sessionOrBearerSecurity, {}];
