export type UnusualState =
  | "empty_word_list"
  | "generation_failed"
  | "invalid_data"
  | "health_unhealthy";

export type RuntimeStatsSnapshot = {
  actions: {
    success: number;
    validation: number;
    not_found: number;
    error: number;
  };
  htmlExports: {
    success: number;
    not_found: number;
    generation_error: number;
    error: number;
    byType: Record<string, number>;
  };
  health: {
    ok: number;
    unhealthy: number;
  };
  unusualStates: Record<UnusualState, number>;
};

const stats: RuntimeStatsSnapshot = {
  actions: { success: 0, validation: 0, not_found: 0, error: 0 },
  htmlExports: {
    success: 0,
    not_found: 0,
    generation_error: 0,
    error: 0,
    byType: {},
  },
  health: { ok: 0, unhealthy: 0 },
  unusualStates: {
    empty_word_list: 0,
    generation_failed: 0,
    invalid_data: 0,
    health_unhealthy: 0,
  },
};

export function recordRuntimeActionOutcome(
  outcome: keyof RuntimeStatsSnapshot["actions"],
) {
  stats.actions[outcome] += 1;
}

export function recordRuntimeHtmlExport(attributes: {
  "activity.type": string;
  outcome: keyof Omit<RuntimeStatsSnapshot["htmlExports"], "byType">;
}) {
  stats.htmlExports[attributes.outcome] += 1;
  const type = attributes["activity.type"] || "unknown";
  stats.htmlExports.byType[type] = (stats.htmlExports.byType[type] ?? 0) + 1;
}

export function recordRuntimeHealth(status: "ok" | "unhealthy") {
  stats.health[status] += 1;
}

export function recordRuntimeUnusualState(state: UnusualState) {
  stats.unusualStates[state] += 1;
}

export function getRuntimeStats(): RuntimeStatsSnapshot {
  return {
    actions: { ...stats.actions },
    htmlExports: {
      success: stats.htmlExports.success,
      not_found: stats.htmlExports.not_found,
      generation_error: stats.htmlExports.generation_error,
      error: stats.htmlExports.error,
      byType: { ...stats.htmlExports.byType },
    },
    health: { ...stats.health },
    unusualStates: { ...stats.unusualStates },
  };
}

/** Test helper — resets in-process counters. */
export function resetRuntimeStats() {
  stats.actions = { success: 0, validation: 0, not_found: 0, error: 0 };
  stats.htmlExports = {
    success: 0,
    not_found: 0,
    generation_error: 0,
    error: 0,
    byType: {},
  };
  stats.health = { ok: 0, unhealthy: 0 };
  stats.unusualStates = {
    empty_word_list: 0,
    generation_failed: 0,
    invalid_data: 0,
    health_unhealthy: 0,
  };
}
