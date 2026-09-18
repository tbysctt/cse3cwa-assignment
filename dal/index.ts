/**
 * Public data access layer. Business logic should import from here only —
 * do not use Drizzle or `dal/client` outside this folder.
 */

import { sql } from "drizzle-orm";

import {
  createActivity,
  deleteActivity,
  getActivity,
  listActivities,
  updateActivity,
} from "./activities";
import { db } from "./client";

export type {
  ActivityConfiguration,
  ActivitySummary,
  ActivityType,
  CreateActivityInput,
  Difficulty,
  ListActivitiesFilter,
  PhonemeInput,
  StoredWord,
  UpdateActivityInput,
  WordInput,
} from "./types";

export { DalNotFoundError, DalValidationError } from "./errors";

export {
  createActivity,
  deleteActivity,
  getActivity,
  listActivities,
  updateActivity,
};

/** Smoke-test the database connection. */
export async function ping(): Promise<boolean> {
  await db.execute(sql`SELECT 1`);
  return true;
}
