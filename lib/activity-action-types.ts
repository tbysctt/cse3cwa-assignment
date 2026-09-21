import type {
  ActivityConfiguration,
  ActivitySummary,
} from "@/dal/types";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; field?: string };

export type SerialisedActivity = Omit<
  ActivityConfiguration,
  "createdAt" | "updatedAt"
> & {
  createdAt: string;
  updatedAt: string;
};

export type SerialisedActivitySummary = Omit<
  ActivitySummary,
  "createdAt" | "updatedAt"
> & {
  createdAt: string;
  updatedAt: string;
};
