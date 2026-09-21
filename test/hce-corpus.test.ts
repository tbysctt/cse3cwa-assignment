import { describe, expect, it } from "vitest";
import {
  HCE_CORPUS,
  HCE_WORDS_3,
  HCE_WORDS_4,
  HCE_WORDS_5,
  HCE_KEYBOARD_ROWS,
  HCE_PHONEME_INVENTORY,
  WORDLE_TARGET,
  WORD_SEARCH_WORDS,
} from "./fixtures";

describe("HCE keyboard and corpus", () => {
  it("exposes the fixed 12-row keyboard with 43 phonemes and blank slots", () => {
    expect(HCE_KEYBOARD_ROWS).toHaveLength(12);
    expect(HCE_KEYBOARD_ROWS.every((row) => row.length === 4)).toBe(true);
    expect(HCE_PHONEME_INVENTORY).toHaveLength(43);
    expect(HCE_KEYBOARD_ROWS.flat().filter((slot) => slot === null)).toHaveLength(
      5,
    );
    expect(HCE_KEYBOARD_ROWS[0].map((slot) => slot?.ipa ?? null)).toEqual([
      "p",
      "t",
      "k",
      null,
    ]);
    expect(HCE_KEYBOARD_ROWS[11].map((slot) => slot?.ipa ?? null)).toEqual([
      "æɔ",
      "ɪə",
      null,
      "ə",
    ]);
  });

  it("uses canonical IPA ɡ and multi-codepoint phonemes as single keys", () => {
    const ipas = HCE_PHONEME_INVENTORY.map((phoneme) => phoneme.ipa);
    expect(ipas).toContain("ɡ");
    expect(ipas).not.toContain("g");
    expect(ipas).toContain("tʃ");
    expect(ipas).toContain("dʒ");
    expect(ipas).toContain("iː");
    expect(ipas).toContain("æɪ");
    expect(ipas).not.toContain("i");
  });

  it("contains exactly 90 unique words with 30 per length", () => {
    expect(HCE_WORDS_3).toHaveLength(30);
    expect(HCE_WORDS_4).toHaveLength(30);
    expect(HCE_WORDS_5).toHaveLength(30);
    expect(HCE_CORPUS).toHaveLength(90);
    expect(new Set(HCE_CORPUS.map((word) => word.id)).size).toBe(90);
    expect(HCE_WORDS_3.every((word) => word.phonemes.length === 3)).toBe(true);
    expect(HCE_WORDS_4.every((word) => word.phonemes.length === 4)).toBe(true);
    expect(HCE_WORDS_5.every((word) => word.phonemes.length === 5)).toBe(true);
  });

  it("keeps every corpus phoneme on the HCE keyboard", () => {
    const allowed = new Set(HCE_PHONEME_INVENTORY.map((phoneme) => phoneme.ipa));
    for (const entry of HCE_CORPUS) {
      for (const phoneme of entry.phonemes) {
        expect(allowed.has(phoneme.ipa)).toBe(true);
      }
    }
  });

  it("canonicalizes great with ɡ and keeps thin as the default Wordle target", () => {
    const great = HCE_WORDS_4.find((word) => word.id === "great");
    expect(great?.phonemes.map((phoneme) => phoneme.ipa)).toEqual([
      "ɡ",
      "ɹ",
      "æɪ",
      "t",
    ]);
    expect(WORDLE_TARGET.id).toBe("thin");
    expect(WORDLE_TARGET.phonemes.map((phoneme) => phoneme.ipa)).toEqual([
      "θ",
      "ɪ",
      "n",
    ]);
  });

  it("defaults Word Search words from the HCE corpus", () => {
    expect(WORD_SEARCH_WORDS).toHaveLength(5);
    for (const word of WORD_SEARCH_WORDS) {
      expect(HCE_CORPUS.some((entry) => entry.id === word.id)).toBe(true);
    }
  });
});
