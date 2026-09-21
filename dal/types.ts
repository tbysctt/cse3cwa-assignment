export type ActivityType = "wordle" | "word_search";

export type Difficulty = "easy" | "medium" | "hard";

export type PhonemeInput = {
  ipa: string;
  grapheme: string;
  example: string;
};

export type WordInput = {
  english: string;
  phonemes: PhonemeInput[];
};

export type CreateActivityInput = {
  name: string;
  activityType: ActivityType;
  difficulty: Difficulty;
  showHints: boolean;
  maxAttempts?: number | null;
  seed?: number | null;
  words: WordInput[];
};

export type UpdateActivityInput = Partial<
  Omit<CreateActivityInput, "activityType">
> & {
  words?: WordInput[];
};

export type StoredWord = {
  id: string;
  english: string;
  phonemes: PhonemeInput[];
};

export type ActivityConfiguration = {
  id: string;
  name: string;
  activityType: ActivityType;
  difficulty: Difficulty;
  showHints: boolean;
  maxAttempts: number | null;
  seed: number | null;
  words: StoredWord[];
  createdAt: Date;
  updatedAt: Date;
};

export type ActivitySummary = Omit<ActivityConfiguration, "words"> & {
  wordCount: number;
};

export type ListActivitiesFilter = {
  activityType?: ActivityType;
};
