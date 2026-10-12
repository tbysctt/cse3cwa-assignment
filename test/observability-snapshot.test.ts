import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/dal", () => ({
  ping: vi.fn(),
  countActivitiesByType: vi.fn(),
  countWords: vi.fn(),
}));

import {
  countActivitiesByType,
  countWords,
  ping,
} from "@/dal";
import { getObservabilitySnapshot } from "@/lib/observability-snapshot";
import {
  recordRuntimeHtmlExport,
  resetRuntimeStats,
} from "@/lib/runtime-stats";

describe("getObservabilitySnapshot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRuntimeStats();
  });

  it("summarises healthy DB state and usage", async () => {
    vi.mocked(ping).mockResolvedValue(true);
    vi.mocked(countActivitiesByType).mockResolvedValue([
      { activityType: "wordle", count: 3 },
      { activityType: "word_search", count: 1 },
    ]);
    vi.mocked(countWords).mockResolvedValue(12);
    recordRuntimeHtmlExport({
      "activity.type": "wordle",
      outcome: "success",
    });

    const snapshot = await getObservabilitySnapshot();

    expect(snapshot.health.status).toBe("ok");
    expect(snapshot.activities.total).toBe(4);
    expect(snapshot.activities.mostUsedType).toBe("wordle");
    expect(snapshot.wordBank).toEqual({ count: 12, empty: false });
    expect(snapshot.runtime.htmlExports.success).toBe(1);
    expect(snapshot.warnings).toEqual([]);
  });

  it("flags unhealthy DB and empty word bank", async () => {
    vi.mocked(ping).mockRejectedValue(new Error("down"));
    vi.mocked(countActivitiesByType).mockResolvedValue([]);
    vi.mocked(countWords).mockResolvedValue(0);

    const snapshot = await getObservabilitySnapshot();

    expect(snapshot.health.status).toBe("unhealthy");
    expect(snapshot.wordBank.empty).toBe(true);
    expect(snapshot.warnings).toEqual(
      expect.arrayContaining([
        "Database health check failed.",
        "Word bank is empty.",
      ]),
    );
  });
});
