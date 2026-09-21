import type {
  ActivityConfiguration,
  ActivitySummary,
  PhonemeInput,
  StoredWord,
} from "./types";

type PhonemeRow = {
  id: string;
  position: number;
  ipa: string;
  grapheme: string;
  example: string;
};

type WordRow = {
  id: string;
  english: string;
  position: number;
  phonemes: PhonemeRow[];
};

type ActivityRow = {
  id: string;
  name: string;
  activityType: ActivityConfiguration["activityType"];
  difficulty: ActivityConfiguration["difficulty"];
  showHints: boolean;
  maxAttempts: number | null;
  seed: number | null;
  createdAt: Date;
  updatedAt: Date;
  words: WordRow[];
};

function mapPhoneme(row: PhonemeRow): PhonemeInput {
  return {
    ipa: row.ipa,
    grapheme: row.grapheme,
    example: row.example,
  };
}

function mapWord(row: WordRow): StoredWord {
  // StoredWord.id is the activity_words row UUID (not a bank slug).
  const phonemes = [...row.phonemes]
    .sort((a, b) => a.position - b.position)
    .map(mapPhoneme);
  return {
    id: row.id,
    english: row.english,
    phonemes,
  };
}

export function mapActivity(row: ActivityRow): ActivityConfiguration {
  const words = [...row.words]
    .sort((a, b) => a.position - b.position)
    .map(mapWord);

  return {
    id: row.id,
    name: row.name,
    activityType: row.activityType,
    difficulty: row.difficulty,
    showHints: row.showHints,
    maxAttempts: row.maxAttempts,
    seed: row.seed,
    words,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapActivitySummary(
  row: Omit<ActivityRow, "words"> & { wordCount: number },
): ActivitySummary {
  return {
    id: row.id,
    name: row.name,
    activityType: row.activityType,
    difficulty: row.difficulty,
    showHints: row.showHints,
    maxAttempts: row.maxAttempts,
    seed: row.seed,
    wordCount: row.wordCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
