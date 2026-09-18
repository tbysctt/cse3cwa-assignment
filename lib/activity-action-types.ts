import type {
  ActivityConfiguration,
  ActivitySummary,
} from "@/dal/types";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; field?: string };

export type SerializedActivity = Omit<
  ActivityConfiguration,
  "createdAt" | "updatedAt"
> & {
  createdAt: string;
  updatedAt: string;
};

export type SerializedActivitySummary = Omit<
  ActivitySummary,
  "createdAt" | "updatedAt"
> & {
  createdAt: string;
  updatedAt: string;
};
