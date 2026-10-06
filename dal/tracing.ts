import { SpanStatusCode, trace } from "@opentelemetry/api";

export async function withDbSpan<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<T> {
  const serviceName = process.env.OTEL_SERVICE_NAME;
  if (!serviceName) {
    return fn();
  }

  const tracer = trace.getTracer(serviceName);
  return tracer.startActiveSpan(`db.${name}`, async (span) => {
    span.setAttribute("db.system", "postgresql");
    try {
      return await fn();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message });
      if (error instanceof Error) {
        span.recordException(error);
      }
      throw error;
    } finally {
      span.end();
    }
  });
}
