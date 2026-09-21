export type Phoneme = {
  /** IPA symbol without slashes, e.g. "θ" */
  ipa: string;
  /** Classroom grapheme label, e.g. "TH" */
  grapheme: string;
  /** Example cue, e.g. "as in thin" */
  example: string;
};

export type PhonemeWord = {
  id: string;
  english: string;
  phonemes: Phoneme[];
};

export type PhonemeLength = 3 | 4 | 5;

export type KeyboardSlot = Phoneme | null;

export const PHONEME_LENGTHS: PhonemeLength[] = [3, 4, 5];

export function isPhonemeLength(value: number): value is PhonemeLength {
  return value === 3 || value === 4 || value === 5;
}

export function formatIpa(ipa: string): string {
  return `/${ipa}/`;
}

export function phonemeWordDisplay(word: PhonemeWord): string {
  return word.phonemes.map((p) => formatIpa(p.ipa)).join(" ");
}

/** Human-readable hint such as "/θ/ → TH (as in thin)". */
export function hintLabel(phoneme: Phoneme): string {
  return `${formatIpa(phoneme.ipa)} → ${phoneme.grapheme} (${phoneme.example})`;
}

export function phonemeByIpa(
  inventory: Phoneme[],
  ipa: string,
): Phoneme {
  const match = inventory.find((phoneme) => phoneme.ipa === ipa);
  if (!match) {
    throw new Error(`Unknown phoneme: ${ipa}`);
  }
  return match;
}

export function resolvePhonemes(
  inventory: Phoneme[],
  ipaSequence: string[],
): Phoneme[] {
  return ipaSequence.map((ipa) => phonemeByIpa(inventory, ipa));
}

export function wordsForLength(
  words: PhonemeWord[],
  length: PhonemeLength,
): PhonemeWord[] {
  return words.filter((word) => word.phonemes.length === length);
}

export function findWord(
  words: PhonemeWord[],
  id: string,
): PhonemeWord | undefined {
  return words.find((entry) => entry.id === id);
}

export function allFillerPhonemes(
  inventory: Phoneme[],
  words: PhonemeWord[] = [],
): Phoneme[] {
  const map = new Map<string, Phoneme>();
  for (const p of inventory) map.set(p.ipa, p);
  for (const word of words) {
    for (const p of word.phonemes) map.set(p.ipa, p);
  }
  return [...map.values()];
}
