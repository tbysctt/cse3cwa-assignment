import { NextResponse, type NextRequest } from "next/server";
import { trace } from "@opentelemetry/api";

/**
 * Injects server-timing traceparent so Faro can correlate browser and server spans.
 * @see https://github.com/grafana/faro-nextjs-example
 */
export function middleware(request: NextRequest) {
  void request;
  const response = NextResponse.next();
  const current = trace.getActiveSpan();

  if (current) {
    const { traceId, spanId } = current.spanContext();
    response.headers.set(
      "server-timing",
      `traceparent;desc="00-${traceId}-${spanId}-01"`,
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
