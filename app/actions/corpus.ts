"use server";

import {
  createCorpusWord,
  deleteCorpusWord,
  listCorpusWords,
  updateCorpusWord,
  DalNotFoundError,
  DalValidationError,
  type CorpusWordInput,
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

export async function listCorpusWordsAction(): Promise<
  ActionResult<PhonemeWord[]>
> {
  try {
    const words = await listCorpusWords();
    return { ok: true, data: words };
  } catch (error) {
    return toActionError(error);
  }
}

export async function createCorpusWordAction(
  input: CorpusWordInput,
): Promise<ActionResult<PhonemeWord>> {
  try {
    const word = await createCorpusWord(input);
    return { ok: true, data: word };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateCorpusWordAction(
  slug: string,
  input: CorpusWordInput,
): Promise<ActionResult<PhonemeWord>> {
  try {
    const word = await updateCorpusWord(slug, input);
    return { ok: true, data: word };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteCorpusWordAction(
  slug: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    await deleteCorpusWord(slug);
    return { ok: true, data: { id: slug } };
  } catch (error) {
    return toActionError(error);
  }
}
