import { describe, expect, it } from "vitest";
import { DalValidationError } from "@/dal/errors";
import type { CreateActivityInput } from "@/dal/types";
import {
  validateCreateActivity,
  validateUpdateActivity,
} from "@/dal/validation";

const phonemes3 = [
  { ipa: "θ", grapheme: "TH", example: "as in thin" },
  { ipa: "ɪ", grapheme: "I", example: "as in thin" },
  { ipa: "n", grapheme: "N", example: "as in thin" },
];

const wordleInput: CreateActivityInput = {
  name: "Thin practice",
  activityType: "wordle",
  difficulty: "medium",
  showHints: true,
  maxAttempts: 6,
  words: [{ english: "thin", phonemes: phonemes3 }],
};

function wordSearchWords() {
  return ["thin", "ship", "chin", "bank", "fan"].map((english) => ({
    english,
    phonemes: phonemes3,
  }));
}

describe("validateCreateActivity", () => {
  it("accepts a valid Wordle activity", () => {
    const result = validateCreateActivity(wordleInput);
    expect(result.name).toBe("Thin practice");
    expect(result.maxAttempts).toBe(6);
    expect(result.seed).toBeNull();
    expect(result.words).toHaveLength(1);
  });

  it("rejects an empty name", () => {
    expect(() =>
      validateCreateActivity({ ...wordleInput, name: "  " }),
    ).toThrow(DalValidationError);
    try {
      validateCreateActivity({ ...wordleInput, name: "" });
    } catch (error) {
      expect(error).toBeInstanceOf(DalValidationError);
      expect((error as DalValidationError).field).toBe("name");
    }
  });

  it("requires exactly one Wordle word and maxAttempts in range", () => {
    expect(() =>
      validateCreateActivity({ ...wordleInput, words: [] }),
    ).toThrow(/exactly one/i);

    expect(() =>
      validateCreateActivity({ ...wordleInput, maxAttempts: 0 }),
    ).toThrow(/maxAttempts/i);

    expect(() =>
      validateCreateActivity({ ...wordleInput, maxAttempts: 11 }),
    ).toThrow(/maxAttempts/i);

    expect(() =>
      validateCreateActivity({ ...wordleInput, seed: 1 }),
    ).toThrow(/seed/i);
  });

  it("accepts a valid Word Search activity", () => {
    const result = validateCreateActivity({
      name: "Five words",
      activityType: "word_search",
      difficulty: "easy",
      showHints: true,
      seed: 42,
      words: wordSearchWords(),
    });
    expect(result.words).toHaveLength(5);
    expect(result.maxAttempts).toBeNull();
    expect(result.seed).toBe(42);
  });

  it("allows null Word Search seed and rejects maxAttempts", () => {
    const result = validateCreateActivity({
      name: "Five words",
      activityType: "word_search",
      difficulty: "easy",
      showHints: true,
      words: wordSearchWords(),
    });
    expect(result.seed).toBeNull();

    expect(() =>
      validateCreateActivity({
        name: "Five words",
        activityType: "word_search",
        difficulty: "easy",
        showHints: true,
        maxAttempts: 6,
        words: wordSearchWords(),
      }),
    ).toThrow(/maxAttempts/i);
  });

  it("requires unique English labels and five words for Word Search", () => {
    const words = wordSearchWords();
    words[1].english = "thin";
    expect(() =>
      validateCreateActivity({
        name: "Dupes",
        activityType: "word_search",
        difficulty: "medium",
        showHints: true,
        words,
      }),
    ).toThrow(/unique/i);

    expect(() =>
      validateCreateActivity({
        name: "Short",
        activityType: "word_search",
        difficulty: "medium",
        showHints: true,
        words: words.slice(0, 3),
      }),
    ).toThrow(/exactly 5/i);
  });

  it("rejects empty phoneme fields and invalid phoneme counts", () => {
    expect(() =>
      validateCreateActivity({
        ...wordleInput,
        words: [
          {
            english: "thin",
            phonemes: [
              { ipa: "", grapheme: "TH", example: "x" },
              { ipa: "ɪ", grapheme: "I", example: "x" },
              { ipa: "n", grapheme: "N", example: "x" },
            ],
          },
        ],
      }),
    ).toThrow(DalValidationError);

    expect(() =>
      validateCreateActivity({
        ...wordleInput,
        words: [
          {
            english: "ab",
            phonemes: [
              { ipa: "æ", grapheme: "A", example: "x" },
              { ipa: "b", grapheme: "B", example: "x" },
            ],
          },
        ],
      }),
    ).toThrow(/3, 4, or 5/);
  });
});

describe("validateUpdateActivity", () => {
  it("merges patches onto the current snapshot", () => {
    const current = validateCreateActivity(wordleInput);
    const next = validateUpdateActivity("wordle", current, {
      name: "Renamed",
      maxAttempts: 8,
    });
    expect(next.name).toBe("Renamed");
    expect(next.maxAttempts).toBe(8);
    expect(next.words).toHaveLength(1);
  });

  it("revalidates replaced words", () => {
    const current = validateCreateActivity(wordleInput);
    expect(() =>
      validateUpdateActivity("wordle", current, { words: [] }),
    ).toThrow(/exactly one/i);
  });
});
