import { describe, expect, it } from "vitest";
import type { Phoneme, PhonemeWord } from "@/lib/phoneme-types";
import {
  clampMaxAttempts,
  evaluateGuess,
  isWinningGuess,
} from "@/lib/wordle";

const phoneme = (ipa: string): Phoneme => ({
  ipa,
  grapheme: ipa.toUpperCase(),
  example: `as in ${ipa}`,
});

const word = (...ipas: string[]): PhonemeWord => ({
  id: "target",
  english: "target",
  phonemes: ipas.map(phoneme),
});

describe("Wordle rules", () => {
  it("scores exact, present, and absent phonemes", () => {
    expect(
      evaluateGuess(["a", "c", "x"].map(phoneme), word("a", "b", "c")),
    ).toEqual(["correct", "present", "absent"]);
  });

  it("does not over-credit repeated phonemes", () => {
    expect(
      evaluateGuess(["a", "a", "a"].map(phoneme), word("a", "b", "a")),
    ).toEqual(["correct", "absent", "correct"]);
  });

  it("scores compound IPA phonemes as atomic symbols", () => {
    expect(
      evaluateGuess(
        ["tʃ", "æɪ", "n"].map(phoneme),
        word("tʃ", "ɪ", "n"),
      ),
    ).toEqual(["correct", "absent", "correct"]);
  });

  it("treats missing guess slots as absent", () => {
    expect(evaluateGuess([phoneme("a")], word("a", "b"))).toEqual([
      "correct",
      "absent",
    ]);
  });

  it("requires at least one correct tile to win", () => {
    expect(isWinningGuess([])).toBe(false);
    expect(isWinningGuess(["correct", "correct"])).toBe(true);
    expect(isWinningGuess(["correct", "present"])).toBe(false);
  });

  it.each([
    [Number.NaN, 6],
    [-4, 1],
    [0, 1],
    [6.9, 6],
    [99, 10],
  ])("clamps attempt value %s to %s", (input, expected) => {
    expect(clampMaxAttempts(input)).toBe(expected);
  });
});
