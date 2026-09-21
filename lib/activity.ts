import type { Phoneme, PhonemeWord } from "@/lib/phoneme-types";
export type Difficulty = "easy" | "medium" | "hard";

export const DIFFICULTY_OPTIONS: ReadonlyArray<{
  value: Difficulty;
  label: string;
}> = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

export function uniquePhonemes(...groups: Phoneme[][]): Phoneme[] {
  const byIpa = new Map<string, Phoneme>();
  for (const phoneme of groups.flat()) byIpa.set(phoneme.ipa, phoneme);
  return [...byIpa.values()];
}

export function activitySignature(words: PhonemeWord[]): string {
  return JSON.stringify(
    words.map(({ id, english, phonemes }) => ({
      id,
      english: english.trim(),
      phonemes: phonemes.map(({ ipa, grapheme, example }) => ({
        ipa,
        grapheme,
        example,
      })),
    })),
  );
}
