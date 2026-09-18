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
