import type { Phoneme, PhonemeWord } from "@/lib/phoneme-types";
import type { Difficulty } from "@/lib/activity";

export type TileStatus = "correct" | "present" | "absent";

export type GuessResult = TileStatus[];

export function evaluateGuess(
  guess: Phoneme[],
  target: PhonemeWord,
): GuessResult {
  const length = target.phonemes.length;
  const result: GuessResult = Array.from({ length }, () => "absent");
  const remaining = target.phonemes.map((p) => p.ipa);

  for (let i = 0; i < length; i += 1) {
    if (guess[i]?.ipa === target.phonemes[i].ipa) {
      result[i] = "correct";
      remaining[i] = "";
    }
  }

  for (let i = 0; i < length; i += 1) {
    if (result[i] === "correct") continue;
    const ipa = guess[i]?.ipa;
    if (!ipa) continue;
    const index = remaining.indexOf(ipa);
    if (index >= 0) {
      result[i] = "present";
      remaining[index] = "";
    }
  }

  return result;
}

export function isWinningGuess(result: GuessResult): boolean {
  return result.length > 0 && result.every((status) => status === "correct");
}

export const DEFAULT_MAX_ATTEMPTS = 6;
export const MIN_MAX_ATTEMPTS = 1;
export const MAX_MAX_ATTEMPTS = 10;

export function clampMaxAttempts(value: number): number {
  if (Number.isNaN(value)) return DEFAULT_MAX_ATTEMPTS;
  return Math.min(MAX_MAX_ATTEMPTS, Math.max(MIN_MAX_ATTEMPTS, Math.floor(value)));
}

/** Modest Assessment 1 behavioural differences: difficulty presets hints/guesses. */
export const DIFFICULTY_PRESETS: Record<
  Difficulty,
  { maxAttempts: number; showHints: boolean }
> = {
  easy: { maxAttempts: 8, showHints: true },
  medium: { maxAttempts: 6, showHints: true },
  hard: { maxAttempts: 5, showHints: false },
};
