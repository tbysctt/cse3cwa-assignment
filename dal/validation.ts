import type { Difficulty } from "@/lib/activity";
import { MAX_MAX_ATTEMPTS, MIN_MAX_ATTEMPTS } from "@/lib/wordle";
import { REQUIRED_WORD_COUNT } from "@/lib/word-search";

import { DalValidationError } from "./errors";
import type {
  ActivityType,
  CreateActivityInput,
  PhonemeInput,
  UpdateActivityInput,
  WordInput,
} from "./types";

const ALLOWED_PHONEME_LENGTHS = new Set([3, 4, 5]);
const DIFFICULTIES = new Set<Difficulty>(["easy", "medium", "hard"]);
const ACTIVITY_TYPES = new Set<ActivityType>(["wordle", "word_search"]);

function fail(message: string, field?: string): never {
  throw new DalValidationError(message, field);
}

function requireNonEmptyString(
  value: unknown,
  field: string,
  label: string,
): string {
  if (typeof value !== "string") {
    fail(`${label} must be a string.`, field);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    fail(`${label} cannot be empty.`, field);
  }
  return trimmed;
}

function validatePhoneme(phoneme: PhonemeInput, path: string): PhonemeInput {
  if (!phoneme || typeof phoneme !== "object") {
    fail(
      "Each phoneme must be an object with ipa, grapheme, and example.",
      path,
    );
  }
  return {
    ipa: requireNonEmptyString(phoneme.ipa, `${path}.ipa`, "Phoneme IPA"),
    grapheme: requireNonEmptyString(
      phoneme.grapheme,
      `${path}.grapheme`,
      "Phoneme grapheme",
    ),
    example: requireNonEmptyString(
      phoneme.example,
      `${path}.example`,
      "Phoneme example",
    ),
  };
}

function validateWord(word: WordInput, path: string): WordInput {
  if (!word || typeof word !== "object") {
    fail("Each word must be an object with english and phonemes.", path);
  }
  const english = requireNonEmptyString(
    word.english,
    `${path}.english`,
    "English word",
  );
  if (!Array.isArray(word.phonemes) || word.phonemes.length === 0) {
    fail("Each word needs at least one phoneme.", `${path}.phonemes`);
  }
  if (!ALLOWED_PHONEME_LENGTHS.has(word.phonemes.length)) {
    fail(
      `Each word must have 3, 4, or 5 phonemes (got ${word.phonemes.length}).`,
      `${path}.phonemes`,
    );
  }
  return {
    english,
    phonemes: word.phonemes.map((phoneme, index) =>
      validatePhoneme(phoneme, `${path}.phonemes[${index}]`),
    ),
  };
}

function validateWordsForType(
  activityType: ActivityType,
  words: WordInput[],
): WordInput[] {
  if (!Array.isArray(words)) {
    fail("Words must be an array.", "words");
  }

  const validated = words.map((word, index) =>
    validateWord(word, `words[${index}]`),
  );

  if (activityType === "wordle") {
    if (validated.length !== 1) {
      fail("Wordle activities require exactly one target word.", "words");
    }
  } else {
    if (validated.length !== REQUIRED_WORD_COUNT) {
      fail(
        `Word Search activities require exactly ${REQUIRED_WORD_COUNT} words.`,
        "words",
      );
    }
    const englishLabels = validated.map((word) => word.english.toLowerCase());
    if (new Set(englishLabels).size !== englishLabels.length) {
      fail("Word Search words must have unique English labels.", "words");
    }
  }

  return validated;
}

function validateMaxAttempts(
  activityType: ActivityType,
  maxAttempts: number | null | undefined,
): number | null {
  if (activityType === "wordle") {
    if (
      maxAttempts === null ||
      maxAttempts === undefined ||
      !Number.isInteger(maxAttempts)
    ) {
      fail(
        `Wordle maxAttempts must be an integer from ${MIN_MAX_ATTEMPTS} to ${MAX_MAX_ATTEMPTS}.`,
        "maxAttempts",
      );
    }
    if (maxAttempts < MIN_MAX_ATTEMPTS || maxAttempts > MAX_MAX_ATTEMPTS) {
      fail(
        `Wordle maxAttempts must be an integer from ${MIN_MAX_ATTEMPTS} to ${MAX_MAX_ATTEMPTS}.`,
        "maxAttempts",
      );
    }
    return maxAttempts;
  }

  if (maxAttempts !== null && maxAttempts !== undefined) {
    fail("Word Search activities must not set maxAttempts.", "maxAttempts");
  }
  return null;
}

function validateSeed(
  activityType: ActivityType,
  seed: number | null | undefined,
): number | null {
  if (activityType === "wordle") {
    if (seed !== null && seed !== undefined) {
      fail("Wordle activities must not set a puzzle seed.", "seed");
    }
    return null;
  }

  if (seed === null || seed === undefined) {
    return null;
  }
  if (!Number.isInteger(seed)) {
    fail("Word Search seed must be an integer when provided.", "seed");
  }
  return seed;
}

export type ValidatedCreateActivity = {
  name: string;
  activityType: ActivityType;
  difficulty: Difficulty;
  showHints: boolean;
  maxAttempts: number | null;
  seed: number | null;
  words: WordInput[];
};

export function validateCreateActivity(
  input: CreateActivityInput,
): ValidatedCreateActivity {
  if (!input || typeof input !== "object") {
    fail("Activity input must be an object.");
  }
  if (!ACTIVITY_TYPES.has(input.activityType)) {
    fail('activityType must be "wordle" or "word_search".', "activityType");
  }
  if (!DIFFICULTIES.has(input.difficulty)) {
    fail('difficulty must be "easy", "medium", or "hard".', "difficulty");
  }
  if (typeof input.showHints !== "boolean") {
    fail("showHints must be a boolean.", "showHints");
  }

  return {
    name: requireNonEmptyString(input.name, "name", "Activity name"),
    activityType: input.activityType,
    difficulty: input.difficulty,
    showHints: input.showHints,
    maxAttempts: validateMaxAttempts(input.activityType, input.maxAttempts),
    seed: validateSeed(input.activityType, input.seed),
    words: validateWordsForType(input.activityType, input.words),
  };
}

export function validateUpdateActivity(
  activityType: ActivityType,
  current: ValidatedCreateActivity,
  patch: UpdateActivityInput,
): ValidatedCreateActivity {
  if (!patch || typeof patch !== "object") {
    fail("Update input must be an object.");
  }

  const merged: CreateActivityInput = {
    name: patch.name ?? current.name,
    activityType,
    difficulty: patch.difficulty ?? current.difficulty,
    showHints: patch.showHints ?? current.showHints,
    maxAttempts:
      patch.maxAttempts !== undefined ? patch.maxAttempts : current.maxAttempts,
    seed: patch.seed !== undefined ? patch.seed : current.seed,
    words: patch.words ?? current.words,
  };

  return validateCreateActivity(merged);
}
