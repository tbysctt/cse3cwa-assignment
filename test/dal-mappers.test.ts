import { describe, expect, it } from "vitest";
import { mapActivity, mapActivitySummary } from "@/dal/mappers";

describe("dal mappers", () => {
  it("sorts words and phonemes by position", () => {
    const mapped = mapActivity({
      id: "a1",
      name: "Test",
      activityType: "word_search",
      difficulty: "easy",
      showHints: true,
      maxAttempts: null,
      seed: 1,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      words: [
        {
          id: "w2",
          english: "ship",
          position: 1,
          phonemes: [
            {
              id: "p2",
              position: 1,
              ipa: "ɪ",
              grapheme: "I",
              example: "as in ship",
            },
            {
              id: "p1",
              position: 0,
              ipa: "ʃ",
              grapheme: "SH",
              example: "as in ship",
            },
            {
              id: "p3",
              position: 2,
              ipa: "p",
              grapheme: "P",
              example: "as in ship",
            },
          ],
        },
        {
          id: "w1",
          english: "thin",
          position: 0,
          phonemes: [
            {
              id: "t1",
              position: 0,
              ipa: "θ",
              grapheme: "TH",
              example: "as in thin",
            },
            {
              id: "t2",
              position: 1,
              ipa: "ɪ",
              grapheme: "I",
              example: "as in thin",
            },
            {
              id: "t3",
              position: 2,
              ipa: "n",
              grapheme: "N",
              example: "as in thin",
            },
          ],
        },
      ],
    });

    expect(mapped.words.map((word) => word.english)).toEqual(["thin", "ship"]);
    expect(mapped.words[1].phonemes.map((p) => p.ipa)).toEqual(["ʃ", "ɪ", "p"]);
  });

  it("maps activity summaries with wordCount", () => {
    const summary = mapActivitySummary({
      id: "a1",
      name: "Summary",
      activityType: "wordle",
      difficulty: "hard",
      showHints: false,
      maxAttempts: 5,
      seed: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      wordCount: 1,
    });
    expect(summary.wordCount).toBe(1);
    expect(summary.activityType).toBe("wordle");
  });
});
