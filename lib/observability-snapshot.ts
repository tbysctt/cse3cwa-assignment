import {
  countActivitiesByType,
  countWords,
  ping,
  type ActivityType,
} from "@/dal";
import { getRuntimeStats, type RuntimeStatsSnapshot } from "@/lib/runtime-stats";

export type ObservabilitySnapshot = {
  health: {
    status: "ok" | "unhealthy";
    latencyMs: number;
  };
  activities: {
    byType: { activityType: ActivityType; count: number }[];
    total: number;
    mostUsedType: ActivityType | null;
  };
  wordBank: {
    count: number;
    empty: boolean;
  };
  runtime: RuntimeStatsSnapshot;
  warnings: string[];
};

export async function getObservabilitySnapshot(): Promise<ObservabilitySnapshot> {
  const start = performance.now();
  let healthStatus: "ok" | "unhealthy" = "ok";
  try {
    await ping();
  } catch {
    healthStatus = "unhealthy";
  }
  const latencyMs = performance.now() - start;

  const [byType, wordCount] = await Promise.all([
    countActivitiesByType().catch(() => [] as { activityType: ActivityType; count: number }[]),
    countWords().catch(() => 0),
  ]);

  const total = byType.reduce((sum, row) => sum + row.count, 0);
  const mostUsed =
    byType.length === 0
      ? null
      : [...byType].sort((a, b) => b.count - a.count)[0] ?? null;

  const runtime = getRuntimeStats();
  const warnings: string[] = [];

  if (healthStatus === "unhealthy") {
    warnings.push("Database health check failed.");
  }
  if (wordCount === 0) {
    warnings.push("Word bank is empty.");
  }
  if (runtime.htmlExports.generation_error > 0) {
    warnings.push(
      `${runtime.htmlExports.generation_error} HTML generation failure(s) this process.`,
    );
  }
  if (runtime.actions.validation > 0) {
    warnings.push(
      `${runtime.actions.validation} validation failure(s) this process.`,
    );
  }
  if (runtime.unusualStates.invalid_data > 0) {
    warnings.push(
      `${runtime.unusualStates.invalid_data} invalid-data event(s) this process.`,
    );
  }

  return {
    health: { status: healthStatus, latencyMs },
    activities: {
      byType,
      total,
      mostUsedType: mostUsed?.activityType ?? null,
    },
    wordBank: { count: wordCount, empty: wordCount === 0 },
    runtime,
    warnings,
  };
}
