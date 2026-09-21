import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/dal", () => ({
  ping: vi.fn(),
}));

import { ping } from "@/dal";
import { GET } from "@/app/health/route";

describe("GET /health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 when the database ping succeeds", async () => {
    vi.mocked(ping).mockResolvedValue(true);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ok" });
  });

  it("returns 503 when the database ping fails", async () => {
    vi.mocked(ping).mockRejectedValue(new Error("connection refused"));

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ status: "unhealthy" });
  });
});
