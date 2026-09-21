import {
  KEYBOARD_ROWS,
  WORDS_3,
  WORDS_4,
  WORDS_5,
} from "../scripts/generate-hce-seed.mjs";
import type {
  KeyboardSlot,
  Phoneme,
  PhonemeWord,
} from "@/lib/phoneme-types";

/** Keyboard layout from the HCE seed module. */
export const HCE_KEYBOARD_ROWS: KeyboardSlot[][] =
  KEYBOARD_ROWS as KeyboardSlot[][];

/** Flat inventory of every phoneme key (blanks excluded), in keyboard order. */
export const HCE_PHONEME_INVENTORY: Phoneme[] = HCE_KEYBOARD_ROWS.flat().filter(
  (slot): slot is Phoneme => slot !== null,
);

/** Alias used by older tests. */
export const PHONEME_INVENTORY = HCE_PHONEME_INVENTORY;

function phonemeByIpa(ipa: string): Phoneme {
  const match = HCE_PHONEME_INVENTORY.find((phoneme) => phoneme.ipa === ipa);
  if (!match) {
    throw new Error(`Unknown HCE phoneme: ${ipa}`);
  }
  return match;
}

function wordFromTuple([english, ...ipas]: [string, ...string[]]): PhonemeWord {
  return {
    id: english,
    english,
    phonemes: ipas.map(phonemeByIpa),
  };
}

export const HCE_WORDS_3: PhonemeWord[] = WORDS_3.map(wordFromTuple);
export const HCE_WORDS_4: PhonemeWord[] = WORDS_4.map(wordFromTuple);
export const HCE_WORDS_5: PhonemeWord[] = WORDS_5.map(wordFromTuple);

export const HCE_CORPUS: PhonemeWord[] = [
  ...HCE_WORDS_3,
  ...HCE_WORDS_4,
  ...HCE_WORDS_5,
];

const sortedWords = [...HCE_CORPUS].sort((a, b) =>
  a.english.localeCompare(b.english),
);

export const WORDLE_TARGET: PhonemeWord = HCE_WORDS_3.find(
  (entry) => entry.id === "thin",
)!;

export const WORD_SEARCH_WORDS: PhonemeWord[] = [
  HCE_CORPUS.find((w) => w.id === "thin")!,
  HCE_CORPUS.find((w) => w.id === "ship")!,
  HCE_CORPUS.find((w) => w.id === "chin")!,
  HCE_CORPUS.find((w) => w.id === "bank")!,
  HCE_CORPUS.find((w) => w.id === "fan")!,
];

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
