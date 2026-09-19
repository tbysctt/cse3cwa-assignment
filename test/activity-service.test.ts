import { TEST_REFERENCE } from "./fixtures";
import { describe, expect, it } from "vitest";
import type { ActivityConfiguration } from "@/dal";
import {
  buildHtmlFromActivity,
  buildWordleCreateInput,
  buildWordSearchCreateInput,
  inventoryForTarget,
  storedWordToPhonemeWord,
  wordToInput,
} from "@/lib/activity-service";
import { HCE_PHONEME_INVENTORY } from "@/data/phonemes";
import { DEFAULT_WORD_SEARCH_SEED } from "@/lib/word-search";

const thinPhonemes = [
  { ipa: "θ", grapheme: "TH", example: "as in thin" },
  { ipa: "ɪ", grapheme: "I", example: "as in thin" },
  { ipa: "n", grapheme: "N", example: "as in thin" },
];

const thinWord = {
  id: "thin",
  english: "thin",
  phonemes: thinPhonemes,
};

describe("activity-service", () => {
  it("maps phoneme words to DAL create payloads", () => {
    expect(wordToInput(thinWord)).toEqual({
      english: "thin",
      phonemes: thinPhonemes,
    });

    expect(
      buildWordleCreateInput({
        name: "Thin practice",
        difficulty: "medium",
        showHints: true,
        maxAttempts: 6,
        target: thinWord,
      }),
    ).toMatchObject({
      activityType: "wordle",
      maxAttempts: 6,
      words: [{ english: "thin" }],
    });

    expect(
      buildWordSearchCreateInput({
        name: "Five words",
        difficulty: "easy",
        showHints: true,
        words: [thinWord, thinWord, thinWord, thinWord, thinWord],
      }).seed,
    ).toBe(DEFAULT_WORD_SEARCH_SEED);
  });

  it("maps stored words back to PhonemeWord and extends inventory", () => {
    const mapped = storedWordToPhonemeWord({
      id: "db-1",
      english: "thin",
      phonemes: thinPhonemes,
    });
    expect(mapped.id).toBe("db-1");
    expect(inventoryForTarget(mapped, HCE_PHONEME_INVENTORY).some((p) => p.ipa === "θ")).toBe(true);
  });

  it("builds Wordle HTML from a stored activity", () => {
    const activity: ActivityConfiguration = {
      id: "a1",
      name: "Thin",
      activityType: "wordle",
      difficulty: "medium",
      showHints: true,
      maxAttempts: 6,
      seed: null,
      words: [{ id: "w1", english: "thin", phonemes: thinPhonemes }],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const file = buildHtmlFromActivity(activity, TEST_REFERENCE);
    expect(file.filename).toBe("phoneme-wordle.html");
    expect(file.html).toContain("<!DOCTYPE html>");
    expect(file.html).toContain("thin");
  });

  it("builds Word Search HTML from a stored activity", () => {
    const corpus = [
      {
        english: "thin",
        phonemes: [
          { ipa: "θ", grapheme: "TH", example: "as in thin" },
          { ipa: "ɪ", grapheme: "I", example: "as in thin" },
          { ipa: "n", grapheme: "N", example: "as in thin" },
        ],
      },
      {
        english: "ship",
        phonemes: [
          { ipa: "ʃ", grapheme: "SH", example: "as in ship" },
          { ipa: "ɪ", grapheme: "I", example: "as in ship" },
          { ipa: "p", grapheme: "P", example: "as in ship" },
        ],
      },
      {
        english: "chin",
        phonemes: [
          { ipa: "tʃ", grapheme: "CH", example: "as in chin" },
          { ipa: "ɪ", grapheme: "I", example: "as in chin" },
          { ipa: "n", grapheme: "N", example: "as in chin" },
        ],
      },
      {
        english: "fan",
        phonemes: [
          { ipa: "f", grapheme: "F", example: "as in fan" },
          { ipa: "æ", grapheme: "A", example: "as in fan" },
          { ipa: "n", grapheme: "N", example: "as in fan" },
        ],
      },
      {
        english: "bank",
        phonemes: [
          { ipa: "b", grapheme: "B", example: "as in bank" },
          { ipa: "æ", grapheme: "A", example: "as in bank" },
          { ipa: "ŋ", grapheme: "NG", example: "as in bank" },
          { ipa: "k", grapheme: "K", example: "as in bank" },
        ],
      },
    ];

    const activity: ActivityConfiguration = {
      id: "a2",
      name: "Search",
      activityType: "word_search",
      difficulty: "medium",
      showHints: true,
      maxAttempts: null,
      seed: 42,
      words: corpus.map((word, index) => ({ id: `w${index}`, ...word })),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const file = buildHtmlFromActivity(activity, TEST_REFERENCE);
    expect(file.filename).toBe("phoneme-word-search.html");
    expect(file.html).toContain("<!DOCTYPE html>");
    expect(file.html).toContain("thin");
  });

  it("throws when Wordle data is incomplete", () => {
    expect(() =>
      buildHtmlFromActivity({
        id: "a1",
        name: "Broken",
        activityType: "wordle",
        difficulty: "medium",
        showHints: true,
        maxAttempts: null,
        seed: null,
        words: [{ id: "w1", english: "thin", phonemes: thinPhonemes }],
        createdAt: new Date(),
        updatedAt: new Date(),
      }, TEST_REFERENCE),
    ).toThrow(/maxAttempts/i);

    expect(() =>
      buildHtmlFromActivity({
        id: "a1",
        name: "Broken",
        activityType: "wordle",
        difficulty: "medium",
        showHints: true,
        maxAttempts: 6,
        seed: null,
        words: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }, TEST_REFERENCE),
    ).toThrow(/target word/i);
  });

  it("uses the default Word Search seed when stored seed is null", () => {
    const corpus = [
      {
        english: "thin",
        phonemes: thinPhonemes,
      },
      {
        english: "ship",
        phonemes: [
          { ipa: "ʃ", grapheme: "SH", example: "as in ship" },
          { ipa: "ɪ", grapheme: "I", example: "as in ship" },
          { ipa: "p", grapheme: "P", example: "as in ship" },
        ],
      },
      {
        english: "chin",
        phonemes: [
          { ipa: "tʃ", grapheme: "CH", example: "as in chin" },
          { ipa: "ɪ", grapheme: "I", example: "as in chin" },
          { ipa: "n", grapheme: "N", example: "as in chin" },
        ],
      },
      {
        english: "fan",
        phonemes: [
          { ipa: "f", grapheme: "F", example: "as in fan" },
          { ipa: "æ", grapheme: "A", example: "as in fan" },
          { ipa: "n", grapheme: "N", example: "as in fan" },
        ],
      },
      {
        english: "bank",
        phonemes: [
          { ipa: "b", grapheme: "B", example: "as in bank" },
          { ipa: "æ", grapheme: "A", example: "as in bank" },
          { ipa: "ŋ", grapheme: "NG", example: "as in bank" },
          { ipa: "k", grapheme: "K", example: "as in bank" },
        ],
      },
    ];

    const withNullSeed = buildHtmlFromActivity({
      id: "a2",
      name: "Search",
      activityType: "word_search",
      difficulty: "medium",
      showHints: true,
      maxAttempts: null,
      seed: null,
      words: corpus.map((word, index) => ({ id: `w${index}`, ...word })),
      createdAt: new Date(),
      updatedAt: new Date(),
    }, TEST_REFERENCE);
    const withDefaultSeed = buildHtmlFromActivity({
      id: "a2",
      name: "Search",
      activityType: "word_search",
      difficulty: "medium",
      showHints: true,
      maxAttempts: null,
      seed: DEFAULT_WORD_SEARCH_SEED,
      words: corpus.map((word, index) => ({ id: `w${index}`, ...word })),
      createdAt: new Date(),
      updatedAt: new Date(),
    }, TEST_REFERENCE);
    expect(withNullSeed.html).toBe(withDefaultSeed.html);
  });

  it("extends inventory with custom IPA symbols", () => {
    const custom = {
      id: "custom",
      english: "zzz",
      phonemes: [
        { ipa: "z", grapheme: "Z", example: "as in zoo" },
        { ipa: "ʔ", grapheme: "?", example: "glottal" },
        { ipa: "n", grapheme: "N", example: "as in thin" },
      ],
    };
    const inventory = inventoryForTarget(custom, HCE_PHONEME_INVENTORY);
    expect(inventory.some((p) => p.ipa === "ʔ")).toBe(true);
  });
});
