import { HCE_PHONEME_INVENTORY } from "./fixtures";
import { describe, expect, it } from "vitest";
import {
  formatPhonemeSequence,
  parsePhonemeSequence,
  resolveSinglePhoneme,
  validateCustomWord,
} from "@/lib/custom-phonemes";

describe("Custom phonemes parsing and canonicalization", () => {
  it("resolves direct IPA symbols from the HCE inventory", () => {
    const p = resolveSinglePhoneme("θ", HCE_PHONEME_INVENTORY);
    expect(p.ipa).toBe("θ");
    expect(p.grapheme).toBe("TH");

    const k = resolveSinglePhoneme("/k/", HCE_PHONEME_INVENTORY);
    expect(k.ipa).toBe("k");
    expect(k.grapheme).toBe("K");
  });

  it("canonicalizes common Latin typos to IPA equivalents", () => {
    // Latin 'g' to script 'ɡ'
    const g = resolveSinglePhoneme("g", HCE_PHONEME_INVENTORY);
    expect(g.ipa).toBe("ɡ");

    // Latin 'r' to turned 'ɹ'
    const r = resolveSinglePhoneme("r", HCE_PHONEME_INVENTORY);
    expect(r.ipa).toBe("ɹ");
  });

  it("maps common digraphs and graphemes to phonemes", () => {
    expect(resolveSinglePhoneme("th", HCE_PHONEME_INVENTORY).ipa).toBe("θ");
    expect(resolveSinglePhoneme("sh", HCE_PHONEME_INVENTORY).ipa).toBe("ʃ");
    expect(resolveSinglePhoneme("ch", HCE_PHONEME_INVENTORY).ipa).toBe("tʃ");
    expect(resolveSinglePhoneme("ng", HCE_PHONEME_INVENTORY).ipa).toBe("ŋ");
    expect(resolveSinglePhoneme("ee", HCE_PHONEME_INVENTORY).ipa).toBe("iː");
    expect(resolveSinglePhoneme("oo", HCE_PHONEME_INVENTORY).ipa).toBe("ʉː");
  });

  it("creates fallback Phoneme objects for arbitrary non-HCE IPA symbols", () => {
    const custom = resolveSinglePhoneme("x");
    expect(custom.ipa).toBe("x");
    expect(custom.grapheme).toBe("X");
    expect(custom.example).toBe("as in /x/");

    const glottal = resolveSinglePhoneme("/ʔ/");
    expect(glottal.ipa).toBe("ʔ");
  });

  it("parses slash-delimited sequences correctly", () => {
    const result1 = parsePhonemeSequence("/k/ /æ/ /t/", HCE_PHONEME_INVENTORY);
    expect(result1.map((p) => p.ipa)).toEqual(["k", "æ", "t"]);

    const result2 = parsePhonemeSequence("/k//æ//t/", HCE_PHONEME_INVENTORY);
    expect(result2.map((p) => p.ipa)).toEqual(["k", "æ", "t"]);
  });

  it("parses space- and comma-delimited sequences", () => {
    const spaces = parsePhonemeSequence("k æ t", HCE_PHONEME_INVENTORY);
    expect(spaces.map((p) => p.ipa)).toEqual(["k", "æ", "t"]);

    const commas = parsePhonemeSequence("tʃ, æɪ, n", HCE_PHONEME_INVENTORY);
    expect(commas.map((p) => p.ipa)).toEqual(["tʃ", "æɪ", "n"]);
  });

  it("formats sequences back to slash-delimited representation", () => {
    const phonemes = parsePhonemeSequence("/b/ /iː/ /tʃ/", HCE_PHONEME_INVENTORY);
    expect(formatPhonemeSequence(phonemes)).toBe("/b/ /iː/ /tʃ/");
  });

  it("handles empty or whitespace-only inputs gracefully", () => {
    expect(parsePhonemeSequence("", HCE_PHONEME_INVENTORY)).toEqual([]);
    expect(parsePhonemeSequence("   ", HCE_PHONEME_INVENTORY)).toEqual([]);
  });
});

describe("Custom word validation", () => {
  const catPhonemes = parsePhonemeSequence("/k/ /æ/ /t/", HCE_PHONEME_INVENTORY);

  it("validates a well-formed word", () => {
    const result = validateCustomWord("Cat", catPhonemes);
    expect(result.valid).toBe(true);
    expect(result.word).toBeDefined();
    expect(result.word?.english).toBe("Cat");
    expect(result.word?.phonemes).toHaveLength(3);
    expect(result.word?.id).toBe("cat");
  });

  it("rejects empty English label", () => {
    const result = validateCustomWord("", catPhonemes);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/English word/i);
  });

  it("rejects empty phonemes list", () => {
    const result = validateCustomWord("Cat", []);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/at least one phoneme/i);
  });

  it("enforces minimum length option", () => {
    const result = validateCustomWord("Cat", catPhonemes, { minLength: 4 });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/at least 4 phonemes/i);
  });

  it("enforces maximum length option for grid constraints", () => {
    const result = validateCustomWord("Cat", catPhonemes, { maxLength: 2 });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/exceeds/i);
  });
});
