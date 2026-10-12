import { StatusDashboard } from "@/components/observability/StatusDashboard";
import { getObservabilitySnapshot } from "@/lib/observability-snapshot";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Status",
};

export const dynamic = "force-dynamic";

export default async function StatusPage() {
  const snapshot = await getObservabilitySnapshot();

  return (
    <div className="flex flex-col gap-(--section-gap)">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Status</h1>
        <p className="mt-2 max-w-2xl text-absent">
          Live health, activity usage, and unusual-state indicators for this
          running instance. Backend metrics also export to the Grafana OTEL LGTM
          stack; browser RUM is collected with Grafana Faro.
        </p>
      </header>
      <StatusDashboard initial={snapshot} />
    </div>
  );
}
