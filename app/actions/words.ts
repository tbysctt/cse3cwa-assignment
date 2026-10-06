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
import type { PhonemeWord } from "@/lib/phoneme-types";

function toActionError(
  error: unknown,
  context: { action: string },
): ActionResult<never> {
  if (error instanceof DalValidationError) {
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
    return { ok: true, data: words };
  } catch (error) {
    return toActionError(error, { action: "listWords" });
  }
}

export async function createWordAction(
  input: BankWordInput,
): Promise<ActionResult<PhonemeWord>> {
  try {
    const word = await createWord(input);
    logger.info("word.created", {
      action: "createWord",
      "word.id": word.id,
      "word.phoneme_count": word.phonemes.length,
    });
    return { ok: true, data: word };
  } catch (error) {
    return toActionError(error, { action: "createWord" });
  }
}

export async function updateWordAction(
  id: string,
  input: BankWordInput,
): Promise<ActionResult<PhonemeWord>> {
  try {
    const word = await updateWord(id, input);
    logger.info("word.updated", {
      action: "updateWord",
      "word.id": word.id,
      "word.phoneme_count": word.phonemes.length,
    });
    return { ok: true, data: word };
  } catch (error) {
    return toActionError(error, { action: "updateWord" });
  }
}

export async function deleteWordAction(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    await deleteWord(id);
    logger.info("word.deleted", {
      action: "deleteWord",
      "word.id": id,
    });
    return { ok: true, data: { id } };
  } catch (error) {
    return toActionError(error, { action: "deleteWord" });
  }
}
