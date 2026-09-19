import type { Phoneme, PhonemeWord } from "@/lib/phoneme-types";
import { phonemeByIpa } from "@/lib/phoneme-types";

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

const CONSONANT_IPAS = [
  "p",
  "b",
  "t",
  "d",
  "k",
  "ɡ",
  "m",
  "n",
  "ŋ",
  "f",
  "v",
  "θ",
  "ð",
  "s",
  "z",
  "ʃ",
  "ʒ",
  "h",
  "tʃ",
  "dʒ",
  "w",
  "l",
  "ɹ",
  "j",
] as const;

const VOWEL_IPAS = [
  "ɪ",
  "e",
  "æ",
  "ɐ",
  "ɔ",
  "ʊ",
  "ə",
  "iː",
  "eː",
  "ɐː",
  "ɜː",
  "ʉː",
  "oː",
  "æɪ",
  "ɑe",
  "oɪ",
  "əʉ",
  "æɔ",
  "ɪə",
] as const;

function inventoryMaps(inventory: Phoneme[]) {
  return {
    byIpa: new Map(inventory.map((p) => [p.ipa, p])),
    byGrapheme: new Map(
      inventory.map((p) => [p.grapheme.toLowerCase(), p]),
    ),
  };
}

/**
 * Resolves a single raw token to a Phoneme object.
 * Checks exact IPA, aliases, graphemes, or constructs an arbitrary fallback Phoneme.
 */
export function resolveSinglePhoneme(
  token: string,
  inventory: Phoneme[] = [],
): Phoneme {
  const cleaned = token.replace(/^\/+|\/+$/g, "").trim();
  if (!cleaned) {
    throw new Error("Phoneme token cannot be empty.");
  }

  const { byIpa, byGrapheme } = inventoryMaps(inventory);

  const directMatch = byIpa.get(cleaned);
  if (directMatch) return directMatch;

  const lower = cleaned.toLowerCase();
  const aliasedIpa = COMMON_ALIASES[lower];
  if (aliasedIpa) {
    const aliasedMatch = byIpa.get(aliasedIpa);
    if (aliasedMatch) return aliasedMatch;
  }

  const graphemeMatch = byGrapheme.get(lower);
  if (graphemeMatch) return graphemeMatch;

  for (const p of inventory) {
    if (p.ipa.toLowerCase() === lower) return p;
  }

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
export function parsePhonemeSequence(
  input: string,
  inventory: Phoneme[] = [],
): Phoneme[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  let rawTokens: string[] = [];

  if (trimmed.includes("/")) {
    const slashMatches = [...trimmed.matchAll(/\/([^/]+)\//g)];
    if (slashMatches.length > 0) {
      rawTokens = slashMatches.map((m) => m[1].trim()).filter(Boolean);
    } else {
      rawTokens = trimmed.split("/").map((t) => t.trim()).filter(Boolean);
    }
  } else if (trimmed.includes(",") || trimmed.includes(";")) {
    rawTokens = trimmed.split(/[,;]+/).map((t) => t.trim()).filter(Boolean);
  } else {
    rawTokens = trimmed.split(/\s+/).map((t) => t.trim()).filter(Boolean);
  }

  return rawTokens.map((token) => resolveSinglePhoneme(token, inventory));
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
  const prefix =
    options?.wordIndex !== undefined ? `Word ${options.wordIndex + 1}: ` : "";

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

function pickByIpas(inventory: Phoneme[], ipas: readonly string[]): Phoneme[] {
  return ipas.flatMap((ipa) => {
    try {
      return [phonemeByIpa(inventory, ipa)];
    } catch {
      return [];
    }
  });
}

/** Grouped phonemes for the teacher palette UI, drawn from the live inventory. */
export function paletteConsonants(inventory: Phoneme[]): Phoneme[] {
  return pickByIpas(inventory, CONSONANT_IPAS);
}

export function paletteVowels(inventory: Phoneme[]): Phoneme[] {
  return pickByIpas(inventory, VOWEL_IPAS);
}
