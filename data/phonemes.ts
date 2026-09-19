/**
 * Seed-source + test fixtures for HCE phonemes.
 * Runtime app code loads the same content from Postgres via the DAL.
 */

export type {
  KeyboardSlot,
  Phoneme,
  PhonemeLength,
  PhonemeWord,
} from "@/lib/phoneme-types";

export {
  formatIpa,
  hintLabel,
  phonemeWordDisplay,
} from "@/lib/phoneme-types";

export {
  HCE_KEYBOARD_ROWS,
  HCE_PHONEME_INVENTORY,
  phonemeByIpa,
  resolveHcePhonemes,
} from "@/data/hce-keyboard";

export {
  HCE_CORPUS,
  HCE_CORPUS_BY_LENGTH,
  HCE_WORDS_3,
  HCE_WORDS_4,
  HCE_WORDS_5,
  PHONEME_LENGTHS,
  wordsForLength,
  findCorpusWord,
  isPhonemeLength,
} from "@/data/hce-corpus";

import {
  HCE_CORPUS,
  HCE_WORDS_3,
  findCorpusWord,
} from "@/data/hce-corpus";
import { HCE_PHONEME_INVENTORY } from "@/data/hce-keyboard";
import type { Phoneme, PhonemeWord } from "@/lib/phoneme-types";
import { allFillerPhonemes } from "@/lib/phoneme-types";

/** Shared phoneme inventory used by tests and the seed generator. */
export const PHONEME_INVENTORY: Phoneme[] = HCE_PHONEME_INVENTORY;

/** Default Wordle target from the HCE 3-phoneme corpus (seed / tests only). */
export const WORDLE_TARGET: PhonemeWord = HCE_WORDS_3.find(
  (entry) => entry.id === "thin",
)!;

/**
 * Assessment 1: default five-word Word Search picks (seed / tests only).
 */
export const WORD_SEARCH_WORDS: PhonemeWord[] = [
  findCorpusWord("thin")!,
  findCorpusWord("ship")!,
  findCorpusWord("chin")!,
  findCorpusWord("bank")!,
  findCorpusWord("fan")!,
];

/** Resolve IPA strings against the fixture inventory. */
export function resolvePhonemes(ipaSequence: string[]): Phoneme[] {
  return ipaSequence.map((ipa) => {
    const match = HCE_PHONEME_INVENTORY.find((p) => p.ipa === ipa);
    if (!match) throw new Error(`Unknown phoneme: ${ipa}`);
    return match;
  });
}

/** Zero-arg filler helper for older tests. */
export function allFixtureFillerPhonemes(): Phoneme[] {
  return allFillerPhonemes(PHONEME_INVENTORY, [
    ...WORD_SEARCH_WORDS,
    ...HCE_CORPUS,
  ]);
}
