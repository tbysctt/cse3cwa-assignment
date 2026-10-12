import { beforeEach, describe, expect, it } from "vitest";

import {
  getRuntimeStats,
  recordRuntimeActionOutcome,
  recordRuntimeHealth,
  recordRuntimeHtmlExport,
  recordRuntimeUnusualState,
  resetRuntimeStats,
} from "@/lib/runtime-stats";

describe("runtime-stats", () => {
  beforeEach(() => {
    resetRuntimeStats();
  });

  it("accumulates action, export, health, and unusual-state counters", () => {
    recordRuntimeActionOutcome("success");
    recordRuntimeActionOutcome("validation");
    recordRuntimeHtmlExport({
      "activity.type": "wordle",
      outcome: "success",
    });
    recordRuntimeHtmlExport({
      "activity.type": "word_search",
      outcome: "generation_error",
    });
    recordRuntimeHealth("ok");
    recordRuntimeUnusualState("invalid_data");

    expect(getRuntimeStats()).toEqual({
      actions: { success: 1, validation: 1, not_found: 0, error: 0 },
      htmlExports: {
        success: 1,
        not_found: 0,
        generation_error: 1,
        error: 0,
        byType: { wordle: 1, word_search: 1 },
      },
      health: { ok: 1, unhealthy: 0 },
      unusualStates: {
        empty_word_list: 0,
        generation_failed: 0,
        invalid_data: 1,
        health_unhealthy: 0,
      },
    });
  });
});
