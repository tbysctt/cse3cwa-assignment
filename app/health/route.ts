import { NextResponse } from "next/server";

import { ping } from "@/dal";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    await ping();
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    logger.error("health.unhealthy", {
      "error.message":
        error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ status: "unhealthy" }, { status: 503 });
  }
}
