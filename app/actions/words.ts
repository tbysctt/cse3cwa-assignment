"use server";

import {
  createWord,
  deleteWord,
  listWords,
  updateWord,
  DalNotFoundError,
  DalValidationError,
  type BankWordInput,
} from "@/dal";
import type { ActionResult } from "@/lib/activity-action-types";
import { logger } from "@/lib/logger";
import {
  recordActionDuration,
  recordUnusualState,
  type ActionOutcome,
} from "@/lib/metrics";
import type { PhonemeWord } from "@/lib/phoneme-types";

function classifyActionOutcome(error: unknown): ActionOutcome {
  if (error instanceof DalValidationError) {
    return "validation";
  }
  if (error instanceof DalNotFoundError) {
    return "not_found";
  }
  return "error";
}

function toActionError(
  error: unknown,
  context: { action: string },
): ActionResult<never> {
  if (error instanceof DalValidationError) {
    recordUnusualState({ state: "invalid_data" });
    logger.warn("word.validation_failed", {
      action: context.action,
      "error.type": "DalValidationError",
      "error.message": error.message,
      "error.field": error.field ?? "",
    });
    return { ok: false, error: error.message, field: error.field };
  }
  if (error instanceof DalNotFoundError) {
    logger.warn("word.not_found", {
      action: context.action,
      "error.type": "DalNotFoundError",
      "error.message": error.message,
    });
    return { ok: false, error: error.message };
  }
  if (error instanceof Error) {
    logger.error("word.failed", {
      action: context.action,
      "error.type": error.name || "Error",
      "error.message": error.message,
    });
    return { ok: false, error: error.message };
  }
  logger.error("word.failed", {
    action: context.action,
    "error.type": "Unknown",
    "error.message": "Something went wrong.",
  });
  return { ok: false, error: "Something went wrong." };
}

export async function listWordsAction(): Promise<ActionResult<PhonemeWord[]>> {
  try {
    const words = await listWords();
    if (words.length === 0) {
      recordUnusualState({ state: "empty_word_list" });
    }
    return { ok: true, data: words };
  } catch (error) {
    return toActionError(error, { action: "listWords" });
  }
}

export async function createWordAction(
  input: BankWordInput,
): Promise<ActionResult<PhonemeWord>> {
  const start = performance.now();
  try {
    const word = await createWord(input);
    recordActionDuration(
      {
        action: "createWord",
        outcome: "success",
        resource: "word",
      },
      performance.now() - start,
    );
    logger.info("word.created", {
      action: "createWord",
      "word.id": word.id,
      "word.phoneme_count": word.phonemes.length,
    });
    return { ok: true, data: word };
  } catch (error) {
    recordActionDuration(
      {
        action: "createWord",
        outcome: classifyActionOutcome(error),
        resource: "word",
      },
      performance.now() - start,
    );
    return toActionError(error, { action: "createWord" });
  }
}

export async function updateWordAction(
  id: string,
  input: BankWordInput,
): Promise<ActionResult<PhonemeWord>> {
  const start = performance.now();
  try {
    const word = await updateWord(id, input);
    recordActionDuration(
      {
        action: "updateWord",
        outcome: "success",
        resource: "word",
      },
      performance.now() - start,
    );
    logger.info("word.updated", {
      action: "updateWord",
      "word.id": word.id,
      "word.phoneme_count": word.phonemes.length,
    });
    return { ok: true, data: word };
  } catch (error) {
    recordActionDuration(
      {
        action: "updateWord",
        outcome: classifyActionOutcome(error),
        resource: "word",
      },
      performance.now() - start,
    );
    return toActionError(error, { action: "updateWord" });
  }
}

export async function deleteWordAction(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  const start = performance.now();
  try {
    await deleteWord(id);
    recordActionDuration(
      {
        action: "deleteWord",
        outcome: "success",
        resource: "word",
      },
      performance.now() - start,
    );
    logger.info("word.deleted", {
      action: "deleteWord",
      "word.id": id,
    });
    return { ok: true, data: { id } };
  } catch (error) {
    recordActionDuration(
      {
        action: "deleteWord",
        outcome: classifyActionOutcome(error),
        resource: "word",
      },
      performance.now() - start,
    );
    return toActionError(error, { action: "deleteWord" });
  }
}
