import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
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

/** Frozen word copies owned by a saved activity (not live bank FKs). */
export const activityWords = pgTable(
  "activity_words",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    activityId: uuid("activity_id")
      .notNull()
      .references(() => activityConfigurations.id, { onDelete: "cascade" }),
    english: text("english").notNull(),
    position: integer("position").notNull(),
  },
  (table) => [
    unique("activity_words_activity_position_uid").on(
      table.activityId,
      table.position,
    ),
  ],
);

/** Denormalized phoneme rows as of activity save time. */
export const activityWordPhonemes = pgTable(
  "activity_word_phonemes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    activityWordId: uuid("activity_word_id")
      .notNull()
      .references(() => activityWords.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    /** IPA may be multi-character (e.g. tʃ, iː, æɪ). */
    ipa: text("ipa").notNull(),
    grapheme: text("grapheme").notNull(),
    example: text("example").notNull(),
  },
  (table) => [
    unique("activity_word_phonemes_word_position_uid").on(
      table.activityWordId,
      table.position,
    ),
  ],
);

/** Shared HCE phoneme catalog (keyboard + word-bank resolution). */
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

/** Shared word bank for builder pickers and CRUD. */
export const words = pgTable(
  "words",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    english: text("english").notNull().unique(),
    phonemeLength: integer("phoneme_length").notNull(),
  },
  (table) => [
    check(
      "words_phoneme_length_check",
      sql`${table.phonemeLength} in (3, 4, 5)`,
    ),
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
    phonemeId: uuid("phoneme_id")
      .notNull()
      .references(() => phonemes.id, { onDelete: "restrict" }),
  },
  (table) => [
    unique("word_phonemes_word_position_uid").on(table.wordId, table.position),
  ],
);

export const activityConfigurationsRelations = relations(
  activityConfigurations,
  ({ many }) => ({
    words: many(activityWords),
  }),
);

export const activityWordsRelations = relations(
  activityWords,
  ({ one, many }) => ({
    activity: one(activityConfigurations, {
      fields: [activityWords.activityId],
      references: [activityConfigurations.id],
    }),
    phonemes: many(activityWordPhonemes),
  }),
);

export const activityWordPhonemesRelations = relations(
  activityWordPhonemes,
  ({ one }) => ({
    word: one(activityWords, {
      fields: [activityWordPhonemes.activityWordId],
      references: [activityWords.id],
    }),
  }),
);

export const phonemesRelations = relations(phonemes, ({ many }) => ({
  keyboardSlots: many(keyboardSlots),
  wordPhonemes: many(wordPhonemes),
}));

export const keyboardSlotsRelations = relations(keyboardSlots, ({ one }) => ({
  phoneme: one(phonemes, {
    fields: [keyboardSlots.phonemeId],
    references: [phonemes.id],
  }),
}));

export const wordsRelations = relations(words, ({ many }) => ({
  phonemes: many(wordPhonemes),
}));

export const wordPhonemesRelations = relations(wordPhonemes, ({ one }) => ({
  word: one(words, {
    fields: [wordPhonemes.wordId],
    references: [words.id],
  }),
  phoneme: one(phonemes, {
    fields: [wordPhonemes.phonemeId],
    references: [phonemes.id],
  }),
}));
