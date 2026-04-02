/**
 * Documentation types for challenge.yaml objective schemas.
 * These interfaces mirror packages/api-schemas/src/objectives.ts
 * and add JSDoc descriptions for AutoTypeTable rendering.
 */

/** A complete objective definition as it appears in `challenge.yaml`. */
export interface Objective {
  /** Unique identifier for this objective within the challenge. Used as the submission key. */
  key: string;
  /** Short label shown in the UI validation list. */
  title: string;
  /** Explanation of what is being validated. */
  description: string;
  /** Display order in the UI (ascending). */
  order: number;
  /**
   * Validation type — determines which `spec` fields are required.
   * One of: `condition`, `status`, `log`, `event`, `connectivity`.
   */
  type: string;
  /** Type-specific validation configuration. Shape depends on `type`. */
  spec: Record<string, unknown>;
}

/**
 * Documentation types for challenge.yaml objective schemas.
 *
 * These interfaces mirror packages/api-schemas/src/objectives.ts
 * and add JSDoc descriptions for AutoTypeTable rendering.
 */

/** Identifies a Kubernetes resource to validate. */
export interface Target {
  /** Kubernetes resource kind — e.g. `Pod`, `Deployment`, `Job`, `Service`. */
  kind: string;
  /** Match a specific resource by name. Mutually exclusive with `labelSelector`. */
  name?: string;
  /**
   * Match resources by label selector.
   * @example `{ app: "my-app" }`
   */
  labelSelector?: Record<string, string>;
}

/** A single Kubernetes condition check (type + expected status). */
export interface ConditionCheck {
  /** Condition type to check — e.g. `Ready`, `Available`, `Complete`. */
  type: string;
  /** Expected status value: `"True"`, `"False"`, or `"Unknown"`. */
  status: string;
}

/** Spec for `type: condition` — checks Kubernetes status conditions. */
export interface ConditionSpec {
  /** Resource to check conditions on. */
  target: Target;
  /** List of condition checks that must all pass. */
  checks: ConditionCheck[] | null;
}

/** A single status field check using a comparison operator. */
export interface StatusCheck {
  /**
   * JSONPath-like field path relative to `.status`.
   * @example `"containerStatuses[0].restartCount"`, `"readyReplicas"`, `"phase"`
   */
  field: string;
  /**
   * Comparison operator: `==`, `!=`, `>`, `<`, `>=`, `<=`.
   */
  operator: string;
  /** Expected value to compare against. */
  value: unknown;
}

/** Spec for `type: status` — checks arbitrary status fields with operators. */
export interface StatusSpec {
  /** Resource to inspect. */
  target: Target;
  /** List of status field checks that must all pass. */
  checks: StatusCheck[] | null;
}

/** Spec for `type: log` — searches container logs for expected strings. */
export interface LogSpec {
  /** Pod to read logs from. */
  target: Target;
  /** Container name to read logs from. Defaults to the first container if omitted. */
  container?: string;
  /** Strings that must all appear in the logs. */
  expectedStrings: string[] | null;
  /** Only consider logs from the last N seconds. Defaults to `300`. */
  sinceSeconds?: number;
}

/** Spec for `type: event` — detects forbidden Kubernetes event reasons. */
export interface EventSpec {
  /** Resource to check events for. */
  target: Target;
  /**
   * Event reason values that must **not** appear.
   * @example `["OOMKilled", "Evicted", "CrashLoopBackOff"]`
   */
  forbiddenReasons: string[] | null;
  /** Time window to search events in, in seconds. Defaults to `300`. */
  sinceSeconds?: number;
}

/** Source pod for connectivity checks. */
export interface SourcePod {
  /** Match the source pod by name. */
  name?: string;
  /** Match the source pod by label selector. */
  labelSelector?: Record<string, string>;
}

/** A single HTTP connectivity check. */
export interface ConnectivityCheck {
  /**
   * Full URL to request from the source pod.
   * @example `"http://backend-service:8080/health"`
   */
  url: string;
  /**
   * Expected HTTP status code. Use `0` to assert the connection is **blocked**.
   * @example `200`, `404`, `0`
   */
  expectedStatusCode: number;
  /** Request timeout in seconds. Defaults to `5`. */
  timeoutSeconds?: number;
}

/** Spec for `type: connectivity` — tests HTTP reachability from a pod. */
export interface ConnectivitySpec {
  /** Pod that will issue the HTTP requests. */
  sourcePod: SourcePod;
  /** URLs to test. All checks must pass. */
  targets: ConnectivityCheck[] | null;
}
