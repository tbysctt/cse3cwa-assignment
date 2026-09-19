import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const activityTypeEnum = pgEnum("activity_type", [
  "wordle",
  "word_search",
]);

export const difficultyEnum = pgEnum("difficulty", ["easy", "medium", "hard"]);

export const activityConfigurations = pgTable("activity_configurations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  activityType: activityTypeEnum("activity_type").notNull(),
  difficulty: difficultyEnum("difficulty").notNull(),
  showHints: boolean("show_hints").notNull(),
  maxAttempts: integer("max_attempts"),
  seed: integer("seed"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const words = pgTable(
  "words",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    activityId: uuid("activity_id")
      .notNull()
      .references(() => activityConfigurations.id, { onDelete: "cascade" }),
    english: text("english").notNull(),
    position: integer("position").notNull(),
  },
  (table) => [
    unique("words_activity_position_uid").on(table.activityId, table.position),
  ],
);

export const wordPhonemes = pgTable(
  "word_phonemes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    wordId: uuid("word_id")
      .notNull()
      .references(() => words.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    /** IPA may be multi-character (e.g. tʃ, iː, æɪ). */
    ipa: text("ipa").notNull(),
    grapheme: text("grapheme").notNull(),
    example: text("example").notNull(),
  },
  (table) => [
    unique("word_phonemes_word_position_uid").on(table.wordId, table.position),
  ],
);

/** Shared HCE phoneme catalog (keyboard + corpus resolution). */
export const phonemes = pgTable("phonemes", {
  id: uuid("id").defaultRandom().primaryKey(),
  ipa: text("ipa").notNull().unique(),
  grapheme: text("grapheme").notNull(),
  example: text("example").notNull(),
});

/** Classroom keyboard layout; null phoneme_id = blank key. */
export const keyboardSlots = pgTable(
  "keyboard_slots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    row: integer("row").notNull(),
    col: integer("col").notNull(),
    phonemeId: uuid("phoneme_id").references(() => phonemes.id, {
      onDelete: "set null",
    }),
  },
  (table) => [unique("keyboard_slots_row_col_uid").on(table.row, table.col)],
);

/** Reference HCE corpus for builder pickers. */
export const corpusWords = pgTable("corpus_words", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  english: text("english").notNull(),
  phonemeLength: integer("phoneme_length").notNull(),
});

export const corpusWordPhonemes = pgTable(
  "corpus_word_phonemes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    corpusWordId: uuid("corpus_word_id")
      .notNull()
      .references(() => corpusWords.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    phonemeId: uuid("phoneme_id")
      .notNull()
      .references(() => phonemes.id, { onDelete: "restrict" }),
  },
  (table) => [
    unique("corpus_word_phonemes_word_position_uid").on(
      table.corpusWordId,
      table.position,
    ),
  ],
);

export const activityConfigurationsRelations = relations(
  activityConfigurations,
  ({ many }) => ({
    words: many(words),
  }),
);

export const wordsRelations = relations(words, ({ one, many }) => ({
  activity: one(activityConfigurations, {
    fields: [words.activityId],
    references: [activityConfigurations.id],
  }),
  phonemes: many(wordPhonemes),
}));

export const wordPhonemesRelations = relations(wordPhonemes, ({ one }) => ({
  word: one(words, {
    fields: [wordPhonemes.wordId],
    references: [words.id],
  }),
}));

export const phonemesRelations = relations(phonemes, ({ many }) => ({
  keyboardSlots: many(keyboardSlots),
  corpusWordPhonemes: many(corpusWordPhonemes),
}));

export const keyboardSlotsRelations = relations(keyboardSlots, ({ one }) => ({
  phoneme: one(phonemes, {
    fields: [keyboardSlots.phonemeId],
    references: [phonemes.id],
  }),
}));

export const corpusWordsRelations = relations(corpusWords, ({ many }) => ({
  phonemes: many(corpusWordPhonemes),
}));

export const corpusWordPhonemesRelations = relations(
  corpusWordPhonemes,
  ({ one }) => ({
    word: one(corpusWords, {
      fields: [corpusWordPhonemes.corpusWordId],
      references: [corpusWords.id],
    }),
    phoneme: one(phonemes, {
      fields: [corpusWordPhonemes.phonemeId],
      references: [phonemes.id],
    }),
  }),
);
