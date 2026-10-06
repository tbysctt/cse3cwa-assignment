import { logs, SeverityNumber } from "@opentelemetry/api-logs";

export type LogAttributes = Record<string, string | number | boolean>;

function emit(
  severityNumber: SeverityNumber,
  severityText: string,
  body: string,
  attributes?: LogAttributes,
) {
  const serviceName = process.env.OTEL_SERVICE_NAME;
  if (!serviceName) {
    return;
  }

  logs.getLogger(serviceName).emit({
    severityNumber,
    severityText,
    body,
    attributes,
  });
}

export const logger = {
  info(body: string, attributes?: LogAttributes) {
    emit(SeverityNumber.INFO, "INFO", body, attributes);
  },
  warn(body: string, attributes?: LogAttributes) {
    emit(SeverityNumber.WARN, "WARN", body, attributes);
  },
  error(body: string, attributes?: LogAttributes) {
    emit(SeverityNumber.ERROR, "ERROR", body, attributes);
  },
};
