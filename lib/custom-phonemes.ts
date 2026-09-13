import type { Phoneme, PhonemeWord } from "@/data/phonemes";
import {
  HCE_PHONEME_INVENTORY,
  phonemeByIpa,
} from "@/data/hce-keyboard";

/**
 * Common typo / alternate spelling mapping to canonical HCE IPA symbols.
 */
const COMMON_ALIASES: Record<string, string> = {
  // Consonants
  g: "ɡ",
  r: "ɹ",
  th: "θ",
  dh: "ð",
  sh: "ʃ",
  ch: "tʃ",
  j: "dʒ",
  ng: "ŋ",
  zh: "ʒ",
  // Vowels / diphthongs
  ee: "iː",
  i: "ɪ",
  e: "e",
  air: "eː",
  a: "æ",
  u: "ɐ",
  ar: "ɐː",
  er: "ɜː",
  oo: "ʉː",
  o: "ɔ",
  or: "oː",
  ay: "æɪ",
  ie: "ɑe",
  oy: "oɪ",
  oh: "əʉ",
  ow: "æɔ",
  ear: "ɪə",
  uh: "ə",
};

// Map of canonical IPA -> Phoneme for quick lookup
const INVENTORY_MAP = new Map<string, Phoneme>(
  HCE_PHONEME_INVENTORY.map((p) => [p.ipa, p]),
);

// Map of grapheme -> Phoneme (case-insensitive)
const GRAPHEME_MAP = new Map<string, Phoneme>(
  HCE_PHONEME_INVENTORY.map((p) => [p.grapheme.toLowerCase(), p]),
);

/**
 * Resolves a single raw token to a Phoneme object.
 * Checks exact IPA, aliases, graphemes, or constructs an arbitrary fallback Phoneme.
 */
export function resolveSinglePhoneme(token: string): Phoneme {
  const cleaned = token.replace(/^\/+|\/+$/g, "").trim();
  if (!cleaned) {
    throw new Error("Phoneme token cannot be empty.");
  }

  // 1. Direct IPA match in HCE inventory
  const directMatch = INVENTORY_MAP.get(cleaned);
  if (directMatch) return directMatch;

  // 2. Common typo / alias mapping (e.g. g -> ɡ, r -> ɹ, th -> θ)
  const lower = cleaned.toLowerCase();
  const aliasedIpa = COMMON_ALIASES[lower];
  if (aliasedIpa) {
    const aliasedMatch = INVENTORY_MAP.get(aliasedIpa);
    if (aliasedMatch) return aliasedMatch;
  }

  // 3. Grapheme match (e.g. "TH", "SH", "CH", "EE")
  const graphemeMatch = GRAPHEME_MAP.get(lower);
  if (graphemeMatch) return graphemeMatch;

  // 4. Case-insensitive IPA match
  for (const p of HCE_PHONEME_INVENTORY) {
    if (p.ipa.toLowerCase() === lower) return p;
  }

  // 5. Arbitrary phoneme fallback (for symbols outside the 43 HCE items)
  return {
    ipa: cleaned,
    grapheme: cleaned.toUpperCase(),
    example: `as in /${cleaned}/`,
  };
}

/**
 * Parses arbitrary user text into an array of Phonemes.
 * Accepts slash notation (`/k/ /æ/ /t/` or `/k//æ//t/`), space/comma separation (`k æ t`),
 * or compound symbols (`tʃ, æɪ, n`).
 */
export function parsePhonemeSequence(input: string): Phoneme[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  let rawTokens: string[] = [];

  // Check if string contains slashes
  if (trimmed.includes("/")) {
    const slashMatches = [...trimmed.matchAll(/\/([^/]+)\//g)];
    if (slashMatches.length > 0) {
      rawTokens = slashMatches.map((m) => m[1].trim()).filter(Boolean);
    } else {
      // Split by slash and filter empty
      rawTokens = trimmed.split("/").map((t) => t.trim()).filter(Boolean);
    }
  } else if (trimmed.includes(",") || trimmed.includes(";")) {
    rawTokens = trimmed.split(/[,;]+/).map((t) => t.trim()).filter(Boolean);
  } else {
    // Space-delimited
    rawTokens = trimmed.split(/\s+/).map((t) => t.trim()).filter(Boolean);
  }

  return rawTokens.map(resolveSinglePhoneme);
}

/**
 * Formats an array of phonemes back to a slash-separated string: `/k/ /æ/ /t/`.
 */
export function formatPhonemeSequence(phonemes: Phoneme[]): string {
  return phonemes.map((p) => `/${p.ipa}/`).join(" ");
}

export type WordValidationResult = {
  valid: boolean;
  error?: string;
  word?: PhonemeWord;
};

/**
 * Validates a custom word entry with English label and phoneme sequence.
 */
export function validateCustomWord(
  english: string,
  phonemes: Phoneme[],
  options?: {
    minLength?: number;
    maxLength?: number;
    wordIndex?: number;
  },
): WordValidationResult {
  const trimmed = english.trim();
  const prefix = options?.wordIndex !== undefined ? `Word ${options.wordIndex + 1}: ` : "";

  if (!trimmed) {
    return {
      valid: false,
      error: `${prefix}Please enter an English word name or label.`,
    };
  }

  if (phonemes.length === 0) {
    return {
      valid: false,
      error: `${prefix}Please enter at least one phoneme for “${trimmed}”.`,
    };
  }

  const min = options?.minLength ?? 1;
  if (phonemes.length < min) {
    return {
      valid: false,
      error: `${prefix}“${trimmed}” must have at least ${min} phoneme${min > 1 ? "s" : ""}.`,
    };
  }

  if (options?.maxLength && phonemes.length > options.maxLength) {
    return {
      valid: false,
      error: `${prefix}“${trimmed}” has ${phonemes.length} phonemes, which exceeds the ${options.maxLength} maximum for this grid size.`,
    };
  }

  const safeId =
    trimmed
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .replace(/^-+|-+$/g, "") || `custom-${Date.now()}`;

  return {
    valid: true,
    word: {
      id: safeId,
      english: trimmed,
      phonemes,
    },
  };
}

/** Grouped phonemes for the teacher palette UI. */
export const PALETTE_CONSONANTS: Phoneme[] = [
  // Plosives/Stops
  phonemeByIpa("p"),
  phonemeByIpa("b"),
  phonemeByIpa("t"),
  phonemeByIpa("d"),
  phonemeByIpa("k"),
  phonemeByIpa("ɡ"),
  // Nasals
  phonemeByIpa("m"),
  phonemeByIpa("n"),
  phonemeByIpa("ŋ"),
  // Fricatives
  phonemeByIpa("f"),
  phonemeByIpa("v"),
  phonemeByIpa("θ"),
  phonemeByIpa("ð"),
  phonemeByIpa("s"),
  phonemeByIpa("z"),
  phonemeByIpa("ʃ"),
  phonemeByIpa("ʒ"),
  phonemeByIpa("h"),
  // Affricates
  phonemeByIpa("tʃ"),
  phonemeByIpa("dʒ"),
  // Approximants / Liquids / Glides
  phonemeByIpa("w"),
  phonemeByIpa("l"),
  phonemeByIpa("ɹ"),
  phonemeByIpa("j"),
];

export const PALETTE_VOWELS: Phoneme[] = [
  // Short vowels / Monophthongs
  phonemeByIpa("ɪ"),
  phonemeByIpa("e"),
  phonemeByIpa("æ"),
  phonemeByIpa("ɐ"),
  phonemeByIpa("ɔ"),
  phonemeByIpa("ʊ"),
  phonemeByIpa("ə"),
  // Long vowels
  phonemeByIpa("iː"),
  phonemeByIpa("eː"),
  phonemeByIpa("ɐː"),
  phonemeByIpa("ɜː"),
  phonemeByIpa("ʉː"),
  phonemeByIpa("oː"),
  // Diphthongs
  phonemeByIpa("æɪ"),
  phonemeByIpa("ɑe"),
  phonemeByIpa("oɪ"),
  phonemeByIpa("əʉ"),
  phonemeByIpa("æɔ"),
  phonemeByIpa("ɪə"),
];
