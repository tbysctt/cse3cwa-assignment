"use client";

import { faro, getWebInstrumentations, initializeFaro } from "@grafana/faro-web-sdk";
import { TracingInstrumentation } from "@grafana/faro-web-tracing";
import { useEffect } from "react";

/**
 * Initializes Grafana Faro RUM once per browser session.
 * Skips when NEXT_PUBLIC_FARO_URL is unset (local without the Alloy collector).
 */
export function FrontendObservability() {
  useEffect(() => {
    if (faro.api) {
      return;
    }

    const url = process.env.NEXT_PUBLIC_FARO_URL;
    if (!url) {
      return;
    }

    try {
      initializeFaro({
        url,
        app: {
          name:
            process.env.NEXT_PUBLIC_FARO_APP_NAME ||
            "phoneme-activity-builder-web",
          namespace:
            process.env.NEXT_PUBLIC_FARO_APP_NAMESPACE ||
            "phoneme-activity-builder",
          version: "0.1.0",
          environment: process.env.NODE_ENV || "development",
        },
        instrumentations: [
          ...getWebInstrumentations(),
          new TracingInstrumentation(),
        ],
      });
    } catch {
      // Faro init is best-effort; never block the UI.
    }
  }, []);

  return null;
}
