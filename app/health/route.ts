import { NextResponse } from "next/server";

import { ping } from "@/dal";
import { logger } from "@/lib/logger";
import { recordHealthCheck, recordUnusualState } from "@/lib/metrics";

export async function GET() {
  const start = performance.now();
  try {
    await ping();
    recordHealthCheck({ status: "ok" }, performance.now() - start);
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    recordHealthCheck({ status: "unhealthy" }, performance.now() - start);
    recordUnusualState({ state: "health_unhealthy" });
    logger.error("health.unhealthy", {
      "error.message":
        error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ status: "unhealthy" }, { status: 503 });
  }
}
