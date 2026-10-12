"use server";

import {
  createActivity,
  deleteActivity,
  getActivity,
  getKeyboardRows,
  listActivities,
  listPhonemeInventory,
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
  SerialisedActivity,
  SerialisedActivitySummary,
} from "@/lib/activity-action-types";
import {
  buildHtmlFromActivity,
  type GeneratedActivityFile,
} from "@/lib/activity-service";
import { logger } from "@/lib/logger";
import {
  recordActionDuration,
  recordHtmlExport,
  type ActionOutcome,
  type HtmlExportOutcome,
} from "@/lib/metrics";
import { WordSearchGenerationError } from "@/lib/word-search";

export type {
  ActionResult,
  SerialisedActivity,
  SerialisedActivitySummary,
} from "@/lib/activity-action-types";

function classifyActionOutcome(error: unknown): ActionOutcome {
  if (error instanceof DalValidationError) {
    return "validation";
  }
  if (error instanceof DalNotFoundError) {
    return "not_found";
  }
  return "error";
}

function classifyHtmlExportOutcome(error: unknown): HtmlExportOutcome {
  if (error instanceof DalNotFoundError) {
    return "not_found";
  }
  if (error instanceof WordSearchGenerationError) {
    return "generation_error";
  }
  return "error";
}

function toActionError(
  error: unknown,
  context: { action: string },
): ActionResult<never> {
  if (error instanceof DalValidationError) {
    logger.warn("activity.validation_failed", {
      action: context.action,
      "error.type": "DalValidationError",
      "error.message": error.message,
      "error.field": error.field ?? "",
    });
    return { ok: false, error: error.message, field: error.field };
  }
  if (error instanceof DalNotFoundError) {
    logger.warn("activity.not_found", {
      action: context.action,
      "error.type": "DalNotFoundError",
      "error.message": error.message,
    });
    return { ok: false, error: error.message };
  }
  if (error instanceof Error) {
    logger.error("activity.failed", {
      action: context.action,
      "error.type": error.name || "Error",
      "error.message": error.message,
    });
    return { ok: false, error: error.message };
  }
  logger.error("activity.failed", {
    action: context.action,
    "error.type": "Unknown",
    "error.message": "Something went wrong.",
  });
  return { ok: false, error: "Something went wrong." };
}

function serializeActivity(activity: ActivityConfiguration): SerialisedActivity {
  return {
    ...activity,
    createdAt: new Date(activity.createdAt).toISOString(),
    updatedAt: new Date(activity.updatedAt).toISOString(),
  };
}

function serializeSummary(
  summary: ActivitySummary,
): SerialisedActivitySummary {
  return {
    ...summary,
    createdAt: new Date(summary.createdAt).toISOString(),
    updatedAt: new Date(summary.updatedAt).toISOString(),
  };
}

export async function listActivitiesAction(
  activityType: ActivityType,
): Promise<ActionResult<SerialisedActivitySummary[]>> {
  try {
    const rows = await listActivities({ activityType });
    return { ok: true, data: rows.map(serializeSummary) };
  } catch (error) {
    return toActionError(error, { action: "listActivities" });
  }
}

export async function getActivityAction(
  id: string,
): Promise<ActionResult<SerialisedActivity>> {
  try {
    const activity = await getActivity(id);
    if (!activity) {
      throw new DalNotFoundError(`Activity configuration "${id}" not found.`);
    }
    return { ok: true, data: serializeActivity(activity) };
  } catch (error) {
    return toActionError(error, { action: "getActivity" });
  }
}

export async function createActivityAction(
  input: CreateActivityInput,
): Promise<ActionResult<SerialisedActivity>> {
  const start = performance.now();
  try {
    const activity = await createActivity(input);
    recordActionDuration(
      {
        action: "createActivity",
        outcome: "success",
        resource: "activity",
      },
      performance.now() - start,
    );
    logger.info("activity.created", {
      action: "createActivity",
      "activity.id": activity.id,
      "activity.type": activity.activityType,
    });
    return { ok: true, data: serializeActivity(activity) };
  } catch (error) {
    recordActionDuration(
      {
        action: "createActivity",
        outcome: classifyActionOutcome(error),
        resource: "activity",
      },
      performance.now() - start,
    );
    return toActionError(error, { action: "createActivity" });
  }
}

export async function updateActivityAction(
  id: string,
  patch: UpdateActivityInput,
): Promise<ActionResult<SerialisedActivity>> {
  const start = performance.now();
  try {
    const activity = await updateActivity(id, patch);
    recordActionDuration(
      {
        action: "updateActivity",
        outcome: "success",
        resource: "activity",
      },
      performance.now() - start,
    );
    logger.info("activity.updated", {
      action: "updateActivity",
      "activity.id": activity.id,
      "activity.type": activity.activityType,
    });
    return { ok: true, data: serializeActivity(activity) };
  } catch (error) {
    recordActionDuration(
      {
        action: "updateActivity",
        outcome: classifyActionOutcome(error),
        resource: "activity",
      },
      performance.now() - start,
    );
    return toActionError(error, { action: "updateActivity" });
  }
}

export async function deleteActivityAction(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  const start = performance.now();
  try {
    await deleteActivity(id);
    recordActionDuration(
      {
        action: "deleteActivity",
        outcome: "success",
        resource: "activity",
      },
      performance.now() - start,
    );
    logger.info("activity.deleted", {
      action: "deleteActivity",
      "activity.id": id,
    });
    return { ok: true, data: { id } };
  } catch (error) {
    recordActionDuration(
      {
        action: "deleteActivity",
        outcome: classifyActionOutcome(error),
        resource: "activity",
      },
      performance.now() - start,
    );
    return toActionError(error, { action: "deleteActivity" });
  }
}

export async function generateStoredActivityHtmlAction(
  id: string,
): Promise<ActionResult<GeneratedActivityFile>> {
  const start = performance.now();
  let activityType = "unknown";
  try {
    const activity = await getActivity(id);
    if (!activity) {
      throw new DalNotFoundError(`Activity configuration "${id}" not found.`);
    }
    activityType = activity.activityType;
    const [inventory, keyboardRows] = await Promise.all([
      listPhonemeInventory(),
      getKeyboardRows(),
    ]);
    const file = buildHtmlFromActivity(activity, { inventory, keyboardRows });
    recordActionDuration(
      {
        action: "generateStoredActivityHtml",
        outcome: "success",
        resource: "activity",
      },
      performance.now() - start,
    );
    recordHtmlExport({
      "activity.type": activity.activityType,
      outcome: "success",
    });
    logger.info("activity.html_generated", {
      action: "generateStoredActivityHtml",
      "activity.id": activity.id,
      "activity.type": activity.activityType,
    });
    return { ok: true, data: file };
  } catch (error) {
    const outcome = classifyActionOutcome(error);
    recordActionDuration(
      {
        action: "generateStoredActivityHtml",
        outcome,
        resource: "activity",
      },
      performance.now() - start,
    );
    recordHtmlExport({
      "activity.type": activityType,
      outcome: classifyHtmlExportOutcome(error),
    });
    return toActionError(error, { action: "generateStoredActivityHtml" });
  }
}
