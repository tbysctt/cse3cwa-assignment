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
import type {
  ActionResult,
  SerializedActivity,
  SerializedActivitySummary,
} from "@/lib/activity-action-types";
import {
  buildHtmlFromActivity,
  type GeneratedActivityFile,
} from "@/lib/activity-service";

export type {
  ActionResult,
  SerializedActivity,
  SerializedActivitySummary,
} from "@/lib/activity-action-types";

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

function serializeActivity(activity: ActivityConfiguration): SerializedActivity {
  return {
    ...activity,
    createdAt: new Date(activity.createdAt).toISOString(),
    updatedAt: new Date(activity.updatedAt).toISOString(),
  };
}

function serializeSummary(
  summary: ActivitySummary,
): SerializedActivitySummary {
  return {
    ...summary,
    createdAt: new Date(summary.createdAt).toISOString(),
    updatedAt: new Date(summary.updatedAt).toISOString(),
  };
}

export async function listActivitiesAction(
  activityType: ActivityType,
): Promise<ActionResult<SerializedActivitySummary[]>> {
  try {
    const rows = await listActivities({ activityType });
    return { ok: true, data: rows.map(serializeSummary) };
  } catch (error) {
    return toActionError(error);
  }
}

export async function getActivityAction(
  id: string,
): Promise<ActionResult<SerializedActivity>> {
  try {
    const activity = await getActivity(id);
    if (!activity) {
      throw new DalNotFoundError(`Activity configuration "${id}" not found.`);
    }
    return { ok: true, data: serializeActivity(activity) };
  } catch (error) {
    return toActionError(error);
  }
}

export async function createActivityAction(
  input: CreateActivityInput,
): Promise<ActionResult<SerializedActivity>> {
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
): Promise<ActionResult<SerializedActivity>> {
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
      throw new DalNotFoundError(`Activity configuration "${id}" not found.`);
    }
    return { ok: true, data: buildHtmlFromActivity(activity) };
  } catch (error) {
    return toActionError(error);
  }
}
