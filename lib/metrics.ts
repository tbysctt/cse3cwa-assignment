import { metrics } from "@opentelemetry/api";

import {
  recordRuntimeActionOutcome,
  recordRuntimeHealth,
  recordRuntimeHtmlExport,
  recordRuntimeUnusualState,
  type UnusualState,
} from "@/lib/runtime-stats";

export type ActionOutcome = "success" | "validation" | "not_found" | "error";
export type ActionResource = "activity" | "word";
export type HtmlExportOutcome =
  | "success"
  | "not_found"
  | "generation_error"
  | "error";
export type HealthStatus = "ok" | "unhealthy";
export type { UnusualState };

type Counter = ReturnType<
  NonNullable<ReturnType<typeof metrics.getMeter>>["createCounter"]
>;
type Histogram = ReturnType<
  NonNullable<ReturnType<typeof metrics.getMeter>>["createHistogram"]
>;

function getMeter() {
  const serviceName = process.env.OTEL_SERVICE_NAME;
  if (!serviceName) {
    return null;
  }
  return metrics.getMeter(serviceName);
}

let actionDuration: Histogram | null | undefined;
let htmlExportTotal: Counter | null | undefined;
let healthCheckTotal: Counter | null | undefined;
let healthCheckDuration: Histogram | null | undefined;
let unusualStateTotal: Counter | null | undefined;

/**
 * Lazily create instruments. If creation previously failed (null) because the
 * MeterProvider was not ready yet, retry on the next record call.
 */
function getOrCreateCounter(
  cached: Counter | null | undefined,
  create: () => Counter | null,
): { instrument: Counter | null; next: Counter | null | undefined } {
  if (cached) {
    return { instrument: cached, next: cached };
  }
  const created = create();
  // Keep undefined when null so the next call retries after provider registration.
  return { instrument: created, next: created ?? undefined };
}

function getOrCreateHistogram(
  cached: Histogram | null | undefined,
  create: () => Histogram | null,
): { instrument: Histogram | null; next: Histogram | null | undefined } {
  if (cached) {
    return { instrument: cached, next: cached };
  }
  const created = create();
  return { instrument: created, next: created ?? undefined };
}

function actionDurationHistogram() {
  const meter = getMeter();
  const { instrument, next } = getOrCreateHistogram(actionDuration, () =>
    meter
      ? meter.createHistogram("app.action.duration", {
          description:
            "Duration of mutating/export server actions in milliseconds",
          unit: "ms",
        })
      : null,
  );
  actionDuration = next;
  return instrument;
}

function htmlExportCounter() {
  const meter = getMeter();
  const { instrument, next } = getOrCreateCounter(htmlExportTotal, () =>
    meter
      ? meter.createCounter("activity.html_export.total", {
          description: "Count of stored activity HTML export attempts",
        })
      : null,
  );
  htmlExportTotal = next;
  return instrument;
}

function healthCheckCounter() {
  const meter = getMeter();
  const { instrument, next } = getOrCreateCounter(healthCheckTotal, () =>
    meter
      ? meter.createCounter("app.health.check.total", {
          description: "Count of /health probe results",
        })
      : null,
  );
  healthCheckTotal = next;
  return instrument;
}

function healthCheckHistogram() {
  const meter = getMeter();
  const { instrument, next } = getOrCreateHistogram(healthCheckDuration, () =>
    meter
      ? meter.createHistogram("app.health.check.duration", {
          description: "Duration of /health database ping in milliseconds",
          unit: "ms",
        })
      : null,
  );
  healthCheckDuration = next;
  return instrument;
}

function unusualStateCounter() {
  const meter = getMeter();
  const { instrument, next } = getOrCreateCounter(unusualStateTotal, () =>
    meter
      ? meter.createCounter("app.unusual_state.total", {
          description:
            "Count of unusual application states (empty lists, generation failures, invalid data)",
        })
      : null,
  );
  unusualStateTotal = next;
  return instrument;
}

export function recordActionDuration(
  attributes: {
    action: string;
    outcome: ActionOutcome;
    resource: ActionResource;
  },
  durationMs: number,
) {
  actionDurationHistogram()?.record(durationMs, attributes);
  recordRuntimeActionOutcome(attributes.outcome);
}

export function recordHtmlExport(attributes: {
  "activity.type": string;
  outcome: HtmlExportOutcome;
}) {
  htmlExportCounter()?.add(1, attributes);
  recordRuntimeHtmlExport(attributes);
}

export function recordHealthCheck(
  attributes: { status: HealthStatus },
  durationMs: number,
) {
  healthCheckCounter()?.add(1, attributes);
  healthCheckHistogram()?.record(durationMs, attributes);
  recordRuntimeHealth(attributes.status);
}

export function recordUnusualState(attributes: { state: UnusualState }) {
  unusualStateCounter()?.add(1, attributes);
  recordRuntimeUnusualState(attributes.state);
}
