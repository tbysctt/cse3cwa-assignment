import { NextResponse } from "next/server";

import { ping } from "@/dal";

export async function GET() {
  try {
    await ping();
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch {
    return NextResponse.json({ status: "unhealthy" }, { status: 503 });
  }
}
