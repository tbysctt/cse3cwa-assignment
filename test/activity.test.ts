import { describe, expect, it } from "vitest";
import { PHONEME_INVENTORY, WORDLE_TARGET } from "./fixtures";
import {
  activitySignature,
  DIFFICULTY_OPTIONS,
  uniquePhonemes,
} from "@/lib/activity";

describe("shared activity helpers", () => {
  it("exposes the three supported difficulty levels", () => {
    expect(DIFFICULTY_OPTIONS.map((option) => option.value)).toEqual([
      "easy",
      "medium",
      "hard",
    ]);
  });

  it("deduplicates phonemes by IPA with later metadata taking precedence", () => {
    const replacement = {
      ...PHONEME_INVENTORY[0],
      example: "replacement",
    };
    const result = uniquePhonemes(PHONEME_INVENTORY, [replacement]);
    expect(result).toHaveLength(PHONEME_INVENTORY.length);
    expect(result.find((item) => item.ipa === replacement.ipa)).toBe(
      replacement,
    );
  });

  it("creates collision-safe signatures including labels and metadata", () => {
    const signature = activitySignature([WORDLE_TARGET]);
    expect(JSON.parse(signature)).toEqual([
      {
        id: WORDLE_TARGET.id,
        english: WORDLE_TARGET.english,
        phonemes: WORDLE_TARGET.phonemes,
      },
    ]);
    expect(
      activitySignature([{ ...WORDLE_TARGET, english: "changed" }]),
    ).not.toBe(signature);
  });
});
