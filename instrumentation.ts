import { registerOTel } from "@vercel/otel";

export function register() {
  const serviceName = process.env.OTEL_SERVICE_NAME;
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

  if (!serviceName || !endpoint) {
    console.warn(
      "OpenTelemetry disabled: set OTEL_SERVICE_NAME and OTEL_EXPORTER_OTLP_ENDPOINT to enable.",
    );
    return;
  }

  registerOTel({ serviceName });
}
