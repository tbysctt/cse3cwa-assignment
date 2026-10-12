import { metrics } from "@opentelemetry/api";

export type ActionOutcome = "success" | "validation" | "not_found" | "error";
export type ActionResource = "activity" | "word";
export type HtmlExportOutcome =
  | "success"
  | "not_found"
  | "generation_error"
  | "error";
export type HealthStatus = "ok" | "unhealthy";

function getMeter() {
  const serviceName = process.env.OTEL_SERVICE_NAME;
  if (!serviceName) {
    return null;
  }
  return metrics.getMeter(serviceName);
}

let actionDuration:
  | ReturnType<NonNullable<ReturnType<typeof getMeter>>["createHistogram"]>
  | null
  | undefined;
let htmlExportTotal:
  | ReturnType<NonNullable<ReturnType<typeof getMeter>>["createCounter"]>
  | null
  | undefined;
let healthCheckTotal:
  | ReturnType<NonNullable<ReturnType<typeof getMeter>>["createCounter"]>
  | null
  | undefined;
let healthCheckDuration:
  | ReturnType<NonNullable<ReturnType<typeof getMeter>>["createHistogram"]>
  | null
  | undefined;

function actionDurationHistogram() {
  if (actionDuration !== undefined) {
    return actionDuration;
  }
  const meter = getMeter();
  actionDuration = meter
    ? meter.createHistogram("app.action.duration", {
        description:
          "Duration of mutating/export server actions in milliseconds",
        unit: "ms",
      })
    : null;
  return actionDuration;
}

function htmlExportCounter() {
  if (htmlExportTotal !== undefined) {
    return htmlExportTotal;
  }
  const meter = getMeter();
  htmlExportTotal = meter
    ? meter.createCounter("activity.html_export.total", {
        description: "Count of stored activity HTML export attempts",
      })
    : null;
  return htmlExportTotal;
}

function healthCheckCounter() {
  if (healthCheckTotal !== undefined) {
    return healthCheckTotal;
  }
  const meter = getMeter();
  healthCheckTotal = meter
    ? meter.createCounter("app.health.check.total", {
        description: "Count of /health probe results",
      })
    : null;
  return healthCheckTotal;
}

function healthCheckHistogram() {
  if (healthCheckDuration !== undefined) {
    return healthCheckDuration;
  }
  const meter = getMeter();
  healthCheckDuration = meter
    ? meter.createHistogram("app.health.check.duration", {
        description: "Duration of /health database ping in milliseconds",
        unit: "ms",
      })
    : null;
  return healthCheckDuration;
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
}

export function recordHtmlExport(attributes: {
  "activity.type": string;
  outcome: HtmlExportOutcome;
}) {
  htmlExportCounter()?.add(1, attributes);
}

export function recordHealthCheck(
  attributes: { status: HealthStatus },
  durationMs: number,
) {
  healthCheckCounter()?.add(1, attributes);
  healthCheckHistogram()?.record(durationMs, attributes);
}
