import { asc, eq } from "drizzle-orm";

import { getDb } from "./client";
import {
  corpusWordPhonemes,
  corpusWords,
  keyboardSlots,
  phonemes,
} from "./schema";
import type {
  KeyboardSlot,
  Phoneme,
  PhonemeLength,
  PhonemeWord,
} from "@/lib/phoneme-types";

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

export async function listCorpusWords(options?: {
  length?: PhonemeLength;
}): Promise<PhonemeWord[]> {
  const db = getDb();
  const query = db.select().from(corpusWords);
  const wordRows = await (
    options?.length
      ? query.where(eq(corpusWords.phonemeLength, options.length))
      : query
  ).orderBy(asc(corpusWords.english));

  if (wordRows.length === 0) return [];

  const linkRows = await db
    .select({
      corpusWordId: corpusWordPhonemes.corpusWordId,
      position: corpusWordPhonemes.position,
      ipa: phonemes.ipa,
      grapheme: phonemes.grapheme,
      example: phonemes.example,
    })
    .from(corpusWordPhonemes)
    .innerJoin(phonemes, eq(corpusWordPhonemes.phonemeId, phonemes.id))
    .orderBy(asc(corpusWordPhonemes.position));

  const phonemesByWord = new Map<string, Phoneme[]>();
  for (const link of linkRows) {
    const list = phonemesByWord.get(link.corpusWordId) ?? [];
    list[link.position] = {
      ipa: link.ipa,
      grapheme: link.grapheme,
      example: link.example,
    };
    phonemesByWord.set(link.corpusWordId, list);
  }

  return wordRows.map((row) => ({
    id: row.slug,
    english: row.english,
    phonemes: (phonemesByWord.get(row.id) ?? []).filter(Boolean),
  }));
}

export async function findCorpusWordBySlug(
  slug: string,
): Promise<PhonemeWord | null> {
  const words = await listCorpusWords();
  return words.find((word) => word.id === slug) ?? null;
}
