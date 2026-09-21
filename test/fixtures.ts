import {
  HCE_CORPUS,
  HCE_KEYBOARD_ROWS,
  HCE_PHONEME_INVENTORY,
  WORD_SEARCH_WORDS,
  WORDLE_TARGET,
} from "@/data/phonemes";

/** Shared reference data for unit tests (mirrors DB seed content). */
const sortedWords = [...HCE_CORPUS].sort((a, b) =>
  a.english.localeCompare(b.english),
);

export const TEST_REFERENCE = {
  inventory: HCE_PHONEME_INVENTORY,
  keyboardRows: HCE_KEYBOARD_ROWS,
  words: sortedWords,
} as const;

export const TEST_BUILDER_PROPS = {
  inventory: HCE_PHONEME_INVENTORY,
  keyboardRows: HCE_KEYBOARD_ROWS,
  words: sortedWords,
} as const;

export const TEST_WORD_SEARCH_PROPS = {
  inventory: HCE_PHONEME_INVENTORY,
  words: sortedWords,
} as const;

export { WORDLE_TARGET, WORD_SEARCH_WORDS, HCE_PHONEME_INVENTORY, HCE_KEYBOARD_ROWS, HCE_CORPUS };
