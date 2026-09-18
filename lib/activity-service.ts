import {
  HCE_PHONEME_INVENTORY,
  type Phoneme,
  type PhonemeWord,
} from "@/data/phonemes";
import type {
  ActivityConfiguration,
  CreateActivityInput,
  PhonemeInput,
  StoredWord,
  WordInput,
} from "@/dal/types";
import { generateWordleHtml } from "@/lib/generate-wordle-html";
import { generateWordSearchHtml } from "@/lib/generate-word-search-html";
import {
  DEFAULT_WORD_SEARCH_SEED,
  generateWordSearch,
  GRID_SIZE_BY_DIFFICULTY,
} from "@/lib/word-search";

export function phonemeToInput(phoneme: Phoneme): PhonemeInput {
  return {
    ipa: phoneme.ipa,
    grapheme: phoneme.grapheme,
    example: phoneme.example,
  };
}

export function wordToInput(word: PhonemeWord): WordInput {
  return {
    english: word.english,
    phonemes: word.phonemes.map(phonemeToInput),
  };
}

export function storedWordToPhonemeWord(word: StoredWord): PhonemeWord {
  return {
    id: word.id,
    english: word.english,
    phonemes: word.phonemes.map((phoneme) => ({
      ipa: phoneme.ipa,
      grapheme: phoneme.grapheme,
      example: phoneme.example,
    })),
  };
}

export function inventoryForTarget(target: PhonemeWord): Phoneme[] {
  const extras = target.phonemes.filter(
    (phoneme) => !HCE_PHONEME_INVENTORY.some((p) => p.ipa === phoneme.ipa),
  );
  if (extras.length === 0) return HCE_PHONEME_INVENTORY;
  return [...HCE_PHONEME_INVENTORY, ...extras];
}

export function buildWordleCreateInput(options: {
  name: string;
  difficulty: CreateActivityInput["difficulty"];
  showHints: boolean;
  maxAttempts: number;
  target: PhonemeWord;
}): CreateActivityInput {
  return {
    name: options.name,
    activityType: "wordle",
    difficulty: options.difficulty,
    showHints: options.showHints,
    maxAttempts: options.maxAttempts,
    words: [wordToInput(options.target)],
  };
}

export function buildWordSearchCreateInput(options: {
  name: string;
  difficulty: CreateActivityInput["difficulty"];
  showHints: boolean;
  seed?: number | null;
  words: PhonemeWord[];
}): CreateActivityInput {
  return {
    name: options.name,
    activityType: "word_search",
    difficulty: options.difficulty,
    showHints: options.showHints,
    seed: options.seed ?? DEFAULT_WORD_SEARCH_SEED,
    words: options.words.map(wordToInput),
  };
}

export type GeneratedActivityFile = {
  html: string;
  filename: string;
};

export function buildHtmlFromActivity(
  activity: ActivityConfiguration,
): GeneratedActivityFile {
  if (activity.activityType === "wordle") {
    const storedTarget = activity.words[0];
    if (!storedTarget) {
      throw new Error("Stored Wordle activity is missing its target word.");
    }
    const target = storedWordToPhonemeWord(storedTarget);
    if (activity.maxAttempts == null) {
      throw new Error("Stored Wordle activity is missing maxAttempts.");
    }
    return {
      filename: "phoneme-wordle.html",
      html: generateWordleHtml({
        target,
        inventory: inventoryForTarget(target),
        maxAttempts: activity.maxAttempts,
        difficulty: activity.difficulty,
        showHints: activity.showHints,
      }),
    };
  }

  const words = activity.words.map(storedWordToPhonemeWord);
  const seed = activity.seed ?? DEFAULT_WORD_SEARCH_SEED;
  const puzzle = generateWordSearch(
    words,
    GRID_SIZE_BY_DIFFICULTY[activity.difficulty],
    seed,
  );
  return {
    filename: "phoneme-word-search.html",
    html: generateWordSearchHtml({
      words,
      puzzle,
      seed,
      difficulty: activity.difficulty,
      showHints: activity.showHints,
    }),
  };
}
