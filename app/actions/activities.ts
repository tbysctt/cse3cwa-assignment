"use server";

import {
  createActivity,
  deleteActivity,
  getActivity,
  listActivities,
  updateActivity,
  DalNotFoundError,
  DalValidationError,
  type ActivityConfiguration,
  type ActivitySummary,
  type ActivityType,
  type CreateActivityInput,
  type UpdateActivityInput,
} from "@/dal";
import {
  buildHtmlFromActivity,
  type GeneratedActivityFile,
} from "@/lib/activity-service";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; field?: string };

function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof DalValidationError) {
    return { ok: false, error: error.message, field: error.field };
  }
  if (error instanceof DalNotFoundError) {
    return { ok: false, error: error.message };
  }
  if (error instanceof Error) {
    return { ok: false, error: error.message };
  }
  return { ok: false, error: "Something went wrong." };
}

/** Serialize dates for client components. */
function serializeActivity(
  activity: ActivityConfiguration,
): ActivityConfiguration {
  return {
    ...activity,
    createdAt: new Date(activity.createdAt),
    updatedAt: new Date(activity.updatedAt),
  };
}

function serializeSummary(summary: ActivitySummary): ActivitySummary {
  return {
    ...summary,
    createdAt: new Date(summary.createdAt),
    updatedAt: new Date(summary.updatedAt),
  };
}

export async function listActivitiesAction(
  activityType: ActivityType,
): Promise<ActionResult<ActivitySummary[]>> {
  try {
    const rows = await listActivities({ activityType });
    return { ok: true, data: rows.map(serializeSummary) };
  } catch (error) {
    return toActionError(error);
  }
}

export async function getActivityAction(
  id: string,
): Promise<ActionResult<ActivityConfiguration>> {
  try {
    const activity = await getActivity(id);
    if (!activity) {
      return { ok: false, error: `Activity configuration "${id}" not found.` };
    }
    return { ok: true, data: serializeActivity(activity) };
  } catch (error) {
    return toActionError(error);
  }
}

export async function createActivityAction(
  input: CreateActivityInput,
): Promise<ActionResult<ActivityConfiguration>> {
  try {
    const activity = await createActivity(input);
    return { ok: true, data: serializeActivity(activity) };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateActivityAction(
  id: string,
  patch: UpdateActivityInput,
): Promise<ActionResult<ActivityConfiguration>> {
  try {
    const activity = await updateActivity(id, patch);
    return { ok: true, data: serializeActivity(activity) };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteActivityAction(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    await deleteActivity(id);
    return { ok: true, data: { id } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function generateStoredActivityHtmlAction(
  id: string,
): Promise<ActionResult<GeneratedActivityFile>> {
  try {
    const activity = await getActivity(id);
    if (!activity) {
      return { ok: false, error: `Activity configuration "${id}" not found.` };
    }
    return { ok: true, data: buildHtmlFromActivity(activity) };
  } catch (error) {
    return toActionError(error);
  }
}
