import { Context, metrics } from "@opentelemetry/api";
import { logs, SeverityNumber } from "@opentelemetry/api-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-proto";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  BatchLogRecordProcessor,
  LoggerProvider,
} from "@opentelemetry/sdk-logs";
import {
  MeterProvider,
  PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics";
import {
  ReadableSpan,
  Span,
  SpanProcessor,
} from "@opentelemetry/sdk-trace-node";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { registerOTel } from "@vercel/otel";
import { inspect } from "node:util";

/**
 * Reduces cardinality of Next.js static asset span names (Faro / APM example).
 */
class SpanNameProcessor implements SpanProcessor {
  forceFlush(): Promise<void> {
    return Promise.resolve();
  }

  onStart(span: Span, parentContext: Context): void {
    void parentContext;
    if (span.name.startsWith("GET /_next/static")) {
      span.updateName("GET /_next/static");
    } else if (span.name.startsWith("GET /_next/data")) {
      span.updateName("GET /_next/data");
    } else if (span.name.startsWith("GET /_next/image")) {
      span.updateName("GET /_next/image");
    }
  }

  onEnd(span: ReadableSpan): void {
    void span;
  }

  shutdown(): Promise<void> {
    return Promise.resolve();
  }
}

function formatConsoleArgs(args: unknown[]): string {
  return args
    .map((arg) => (typeof arg === "string" ? arg : inspect(arg, { depth: 4 })))
    .join(" ");
}

function bridgeConsoleToOtel(serviceName: string) {
  const logger = logs.getLogger(serviceName);

  const levels: {
    method: "debug" | "log" | "info" | "warn" | "error";
    severityNumber: SeverityNumber;
    severityText: string;
  }[] = [
    {
      method: "debug",
      severityNumber: SeverityNumber.DEBUG,
      severityText: "DEBUG",
    },
    {
      method: "log",
      severityNumber: SeverityNumber.INFO,
      severityText: "INFO",
    },
    {
      method: "info",
      severityNumber: SeverityNumber.INFO,
      severityText: "INFO",
    },
    {
      method: "warn",
      severityNumber: SeverityNumber.WARN,
      severityText: "WARN",
    },
    {
      method: "error",
      severityNumber: SeverityNumber.ERROR,
      severityText: "ERROR",
    },
  ];

  for (const { method, severityNumber, severityText } of levels) {
    const original = console[method].bind(console);
    console[method] = (...args: unknown[]) => {
      original(...args);
      logger.emit({
        severityNumber,
        severityText,
        body: formatConsoleArgs(args),
      });
    };
  }
}

function registerLogPipeline(serviceName: string) {
  // Configure logs ourselves — @vercel/otel's logRecordProcessors path does not
  // reliably export when mixed with the app's @opentelemetry/sdk-logs instance.
  const loggerProvider = new LoggerProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
    }),
    processors: [
      new BatchLogRecordProcessor({
        exporter: new OTLPLogExporter(),
        scheduledDelayMillis: 500,
      }),
    ],
  });
  logs.setGlobalLoggerProvider(loggerProvider);
}

function registerMetricPipeline(serviceName: string) {
  const exportIntervalMillis = Number(
    process.env.OTEL_METRIC_EXPORT_INTERVAL || 60_000,
  );

  const meterProvider = new MeterProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
    }),
    readers: [
      new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter(),
        exportIntervalMillis: Number.isFinite(exportIntervalMillis)
          ? exportIntervalMillis
          : 60_000,
      }),
    ],
  });
  metrics.setGlobalMeterProvider(meterProvider);
}

export function register() {
  const serviceName = process.env.OTEL_SERVICE_NAME;
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

  if (!serviceName || !endpoint) {
    console.warn(
      "OpenTelemetry disabled: set OTEL_SERVICE_NAME and OTEL_EXPORTER_OTLP_ENDPOINT to enable.",
    );
    return;
  }

  registerOTel({
    serviceName,
    spanProcessors: ["auto", new SpanNameProcessor()],
  });
  registerLogPipeline(serviceName);
  registerMetricPipeline(serviceName);
  bridgeConsoleToOtel(serviceName);
  console.info(`OpenTelemetry enabled for service "${serviceName}"`);
}
