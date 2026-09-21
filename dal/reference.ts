import { and, asc, eq, ne } from "drizzle-orm";

import { getDb } from "./client";
import { DalNotFoundError, DalValidationError } from "./errors";
import { keyboardSlots, phonemes, wordPhonemes, words } from "./schema";
import type { PhonemeInput } from "./types";
import type {
  KeyboardSlot,
  Phoneme,
  PhonemeLength,
  PhonemeWord,
} from "@/lib/phoneme-types";
import { isPhonemeLength } from "@/lib/phoneme-types";

export type BankWordInput = {
  english: string;
  phonemes: PhonemeInput[];
};

function slugifyEnglish(english: string): string {
  const base =
    english
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "word";
  return base;
}

function validateWordInput(input: BankWordInput): {
  english: string;
  phonemes: PhonemeInput[];
  length: PhonemeLength;
} {
  const english = input.english.trim();
  if (!english) {
    throw new DalValidationError("English label is required.", "english");
  }
  if (!Array.isArray(input.phonemes) || input.phonemes.length === 0) {
    throw new DalValidationError(
      "At least one phoneme is required.",
      "phonemes",
    );
  }
  if (!isPhonemeLength(input.phonemes.length)) {
    throw new DalValidationError(
      "Words must have exactly 3, 4, or 5 phonemes.",
      "phonemes",
    );
  }
  for (const [index, phoneme] of input.phonemes.entries()) {
    if (!phoneme.ipa?.trim()) {
      throw new DalValidationError(
        `Phoneme ${index + 1} is missing IPA.`,
        "phonemes",
      );
    }
  }
  return {
    english,
    phonemes: input.phonemes.map((phoneme) => ({
      ipa: phoneme.ipa.trim(),
      grapheme: phoneme.grapheme.trim() || phoneme.ipa.trim().toUpperCase(),
      example: phoneme.example.trim() || `as in /${phoneme.ipa.trim()}/`,
    })),
    length: input.phonemes.length,
  };
}

async function ensureUniqueSlug(
  base: string,
  excludeId?: string,
): Promise<string> {
  const db = getDb();
  let candidate = base;
  let suffix = 2;
  for (;;) {
    const existing = await db
      .select({ id: words.id })
      .from(words)
      .where(
        excludeId
          ? and(eq(words.slug, candidate), ne(words.id, excludeId))
          : eq(words.slug, candidate),
      )
      .limit(1);
    if (existing.length === 0) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

async function resolvePhonemeIds(
  phonemeInputs: PhonemeInput[],
): Promise<string[]> {
  const db = getDb();
  const ids: string[] = [];
  for (const phoneme of phonemeInputs) {
    const [existing] = await db
      .select({ id: phonemes.id })
      .from(phonemes)
      .where(eq(phonemes.ipa, phoneme.ipa))
      .limit(1);
    if (existing) {
      ids.push(existing.id);
      continue;
    }
    const [inserted] = await db
      .insert(phonemes)
      .values({
        ipa: phoneme.ipa,
        grapheme: phoneme.grapheme,
        example: phoneme.example,
      })
      .returning({ id: phonemes.id });
    if (!inserted) {
      throw new Error(`Failed to insert phoneme ${phoneme.ipa}.`);
    }
    ids.push(inserted.id);
  }
  return ids;
}

/**
 * Load a bank word by internal UUID.
 * Returned `PhonemeWord.id` is the public **slug** (not the UUID).
 */
async function loadWordById(id: string): Promise<PhonemeWord | null> {
  const db = getDb();
  const [row] = await db.select().from(words).where(eq(words.id, id)).limit(1);
  if (!row) return null;

  const linkRows = await db
    .select({
      position: wordPhonemes.position,
      ipa: phonemes.ipa,
      grapheme: phonemes.grapheme,
      example: phonemes.example,
    })
    .from(wordPhonemes)
    .innerJoin(phonemes, eq(wordPhonemes.phonemeId, phonemes.id))
    .where(eq(wordPhonemes.wordId, row.id))
    .orderBy(asc(wordPhonemes.position));

  const sequence: Phoneme[] = [];
  for (const link of linkRows) {
    sequence[link.position] = {
      ipa: link.ipa,
      grapheme: link.grapheme,
      example: link.example,
    };
  }

  return {
    id: row.slug,
    english: row.english,
    phonemes: sequence.filter(Boolean),
  };
}

export async function listPhonemeInventory(): Promise<Phoneme[]> {
  const db = getDb();
  const rows = await db
    .select({
      ipa: phonemes.ipa,
      grapheme: phonemes.grapheme,
      example: phonemes.example,
    })
    .from(phonemes)
    .orderBy(asc(phonemes.ipa));

  return rows;
}

export async function getKeyboardRows(): Promise<KeyboardSlot[][]> {
  const db = getDb();
  const rows = await db
    .select({
      row: keyboardSlots.row,
      col: keyboardSlots.col,
      ipa: phonemes.ipa,
      grapheme: phonemes.grapheme,
      example: phonemes.example,
      phonemeId: keyboardSlots.phonemeId,
    })
    .from(keyboardSlots)
    .leftJoin(phonemes, eq(keyboardSlots.phonemeId, phonemes.id))
    .orderBy(asc(keyboardSlots.row), asc(keyboardSlots.col));

  const byRow = new Map<number, KeyboardSlot[]>();
  for (const slot of rows) {
    const list = byRow.get(slot.row) ?? [];
    list[slot.col] = slot.phonemeId
      ? {
          ipa: slot.ipa!,
          grapheme: slot.grapheme!,
          example: slot.example!,
        }
      : null;
    byRow.set(slot.row, list);
  }

  return [...byRow.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, cols]) => cols);
}

export async function listWords(options?: {
  length?: PhonemeLength;
}): Promise<PhonemeWord[]> {
  const db = getDb();
  const query = db.select().from(words);
  const wordRows = await (
    options?.length
      ? query.where(eq(words.phonemeLength, options.length))
      : query
  ).orderBy(asc(words.english));

  if (wordRows.length === 0) return [];

  const linkRows = await db
    .select({
      wordId: wordPhonemes.wordId,
      position: wordPhonemes.position,
      ipa: phonemes.ipa,
      grapheme: phonemes.grapheme,
      example: phonemes.example,
    })
    .from(wordPhonemes)
    .innerJoin(phonemes, eq(wordPhonemes.phonemeId, phonemes.id))
    .orderBy(asc(wordPhonemes.position));

  const phonemesByWord = new Map<string, Phoneme[]>();
  for (const link of linkRows) {
    const list = phonemesByWord.get(link.wordId) ?? [];
    list[link.position] = {
      ipa: link.ipa,
      grapheme: link.grapheme,
      example: link.example,
    };
    phonemesByWord.set(link.wordId, list);
  }

  // PhonemeWord.id is the public slug for bank rows.
  return wordRows.map((row) => ({
    id: row.slug,
    english: row.english,
    phonemes: (phonemesByWord.get(row.id) ?? []).filter(Boolean),
  }));
}

export async function findWordBySlug(
  slug: string,
): Promise<PhonemeWord | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(words)
    .where(eq(words.slug, slug))
    .limit(1);
  if (!row) return null;
  return loadWordById(row.id);
}

export async function createWord(input: BankWordInput): Promise<PhonemeWord> {
  const validated = validateWordInput(input);
  const db = getDb();
  const slug = await ensureUniqueSlug(slugifyEnglish(validated.english));
  const phonemeIds = await resolvePhonemeIds(validated.phonemes);

  const created = await db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(words)
      .values({
        slug,
        english: validated.english,
        phonemeLength: validated.length,
      })
      .returning({ id: words.id });
    if (!inserted) {
      throw new Error("Failed to insert word.");
    }
    await tx.insert(wordPhonemes).values(
      phonemeIds.map((phonemeId, position) => ({
        wordId: inserted.id,
        position,
        phonemeId,
      })),
    );
    return inserted.id;
  });

  const word = await loadWordById(created);
  if (!word) {
    throw new Error("Failed to load created word.");
  }
  return word;
}

export async function updateWord(
  slug: string,
  input: BankWordInput,
): Promise<PhonemeWord> {
  const validated = validateWordInput(input);
  const db = getDb();
  const [existing] = await db
    .select()
    .from(words)
    .where(eq(words.slug, slug))
    .limit(1);
  if (!existing) {
    throw new DalNotFoundError(`Word “${slug}” not found.`);
  }

  const nextSlug = await ensureUniqueSlug(
    slugifyEnglish(validated.english),
    existing.id,
  );
  const phonemeIds = await resolvePhonemeIds(validated.phonemes);

  await db.transaction(async (tx) => {
    await tx
      .update(words)
      .set({
        slug: nextSlug,
        english: validated.english,
        phonemeLength: validated.length,
      })
      .where(eq(words.id, existing.id));

    await tx.delete(wordPhonemes).where(eq(wordPhonemes.wordId, existing.id));

    await tx.insert(wordPhonemes).values(
      phonemeIds.map((phonemeId, position) => ({
        wordId: existing.id,
        position,
        phonemeId,
      })),
    );
  });

  const word = await loadWordById(existing.id);
  if (!word) {
    throw new Error("Failed to load updated word.");
  }
  return word;
}

export async function deleteWord(slug: string): Promise<void> {
  const db = getDb();
  const [existing] = await db
    .select({ id: words.id })
    .from(words)
    .where(eq(words.slug, slug))
    .limit(1);
  if (!existing) {
    throw new DalNotFoundError(`Word “${slug}” not found.`);
  }
  await db.delete(words).where(eq(words.id, existing.id));
}
