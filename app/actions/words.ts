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
import type { PhonemeWord } from "@/lib/phoneme-types";

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

export async function listWordsAction(): Promise<ActionResult<PhonemeWord[]>> {
  try {
    const words = await listWords();
    return { ok: true, data: words };
  } catch (error) {
    return toActionError(error);
  }
}

export async function createWordAction(
  input: BankWordInput,
): Promise<ActionResult<PhonemeWord>> {
  try {
    const word = await createWord(input);
    return { ok: true, data: word };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateWordAction(
  slug: string,
  input: BankWordInput,
): Promise<ActionResult<PhonemeWord>> {
  try {
    const word = await updateWord(slug, input);
    return { ok: true, data: word };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteWordAction(
  slug: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    await deleteWord(slug);
    return { ok: true, data: { id: slug } };
  } catch (error) {
    return toActionError(error);
  }
}
