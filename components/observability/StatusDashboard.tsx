"use client";

import { faro } from "@grafana/faro-web-sdk";
import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

import { SectionCard } from "@/components/shared/SectionCard";
import type { ObservabilitySnapshot } from "@/lib/observability-snapshot";

function subscribeFaroReady(onStoreChange: () => void) {
  const id = window.setInterval(onStoreChange, 2000);
  return () => window.clearInterval(id);
}

function getFaroReadySnapshot() {
  return Boolean(faro.api);
}

function getFaroReadyServerSnapshot() {
  return false;
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "ok" | "warn" | "danger";
}) {
  const toneClass =
    tone === "ok"
      ? "text-correct"
      : tone === "warn"
        ? "text-absent"
        : tone === "danger"
          ? "text-danger"
          : "text-foreground";

  return (
    <div className="rounded-(--control-radius) border border-border bg-surface-muted px-3 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-absent">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}

export function StatusDashboard({
  initial,
}: {
  initial: ObservabilitySnapshot;
}) {
  const router = useRouter();
  const faroReady = useSyncExternalStore(
    subscribeFaroReady,
    getFaroReadySnapshot,
    getFaroReadyServerSnapshot,
  );
  const faroConfigured = Boolean(process.env.NEXT_PUBLIC_FARO_URL);

  useEffect(() => {
    const id = window.setInterval(() => {
      router.refresh();
    }, 8000);
    return () => window.clearInterval(id);
  }, [router]);

  const { health, activities, wordBank, runtime, warnings } = initial;
  const exportTotal =
    runtime.htmlExports.success +
    runtime.htmlExports.not_found +
    runtime.htmlExports.generation_error +
    runtime.htmlExports.error;

  return (
    <div className="flex flex-col gap-(--section-gap)">
      <SectionCard
        title="Health"
        description="Live database probe for this process."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Stat
            label="Status"
            value={health.status === "ok" ? "Healthy" : "Unhealthy"}
            tone={health.status === "ok" ? "ok" : "danger"}
          />
          <Stat
            label="Probe latency"
            value={`${health.latencyMs.toFixed(1)} ms`}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Activity summary"
        description="Saved configurations stored in PostgreSQL."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total saved" value={activities.total} />
          {activities.byType.map((row) => (
            <Stat
              key={row.activityType}
              label={row.activityType === "wordle" ? "Wordle" : "Word Search"}
              value={row.count}
            />
          ))}
          <Stat
            label="Most used type"
            value={
              activities.mostUsedType === "wordle"
                ? "Wordle"
                : activities.mostUsedType === "word_search"
                  ? "Word Search"
                  : "—"
            }
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Usage counters"
        description="Process-local counters mirrored into OpenTelemetry metrics."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="HTML exports" value={exportTotal} />
          <Stat
            label="Successful exports"
            value={runtime.htmlExports.success}
            tone="ok"
          />
          <Stat
            label="Generation failures"
            value={runtime.htmlExports.generation_error}
            tone={
              runtime.htmlExports.generation_error > 0 ? "danger" : "default"
            }
          />
          <Stat
            label="Word bank size"
            value={wordBank.count}
            tone={wordBank.empty ? "danger" : "default"}
          />
          <Stat label="Action successes" value={runtime.actions.success} />
          <Stat
            label="Validation failures"
            value={runtime.actions.validation}
            tone={runtime.actions.validation > 0 ? "warn" : "default"}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Frontend RUM (Faro)"
        description="Browser telemetry via Grafana Faro. Web Vitals, sessions, and page engagement appear in Grafana."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Stat
            label="Collector URL"
            value={faroConfigured ? "Configured" : "Not set"}
            tone={faroConfigured ? "ok" : "warn"}
          />
          <Stat
            label="SDK"
            value={
              faroReady ? "Collecting" : faroConfigured ? "Starting…" : "Disabled"
            }
            tone={faroReady ? "ok" : "warn"}
          />
        </div>
        <p className="mt-3 text-sm text-absent">
          Open Grafana at{" "}
          <a
            className="font-medium text-accent underline-offset-2 hover:underline"
            href="http://localhost:3001"
            target="_blank"
            rel="noreferrer"
          >
            http://localhost:3001
          </a>{" "}
          for the provisioned Phoneme Activity Builder dashboard (includes Faro
          RUM signals when Alloy is running).
        </p>
      </SectionCard>

      <SectionCard
        title="Warnings"
        description="Unusual states detected from health, validation, generation, or empty data."
      >
        {warnings.length === 0 ? (
          <p className="rounded-(--control-radius) border border-border bg-surface-muted px-3 py-2 text-sm text-correct">
            No unusual states reported for this process.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {warnings.map((warning) => (
              <li
                key={warning}
                className="rounded-(--control-radius) border border-danger/40 bg-danger/10 px-3 py-2 text-sm font-semibold text-danger"
              >
                {warning}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
