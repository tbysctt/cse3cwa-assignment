import { asc, count, desc, eq, sql } from "drizzle-orm";

import { getDb, type AppDatabase } from "./client";
import { DalNotFoundError } from "./errors";
import { mapActivity, mapActivitySummary } from "./mappers";
import {
  activityConfigurations,
  wordPhonemes,
  words,
} from "./schema";
import type {
  ActivityConfiguration,
  ActivitySummary,
  CreateActivityInput,
  ListActivitiesFilter,
  UpdateActivityInput,
  WordInput,
} from "./types";
import {
  validateCreateActivity,
  validateUpdateActivity,
  type ValidatedCreateActivity,
} from "./validation";

type DbTransaction = Parameters<
  Parameters<AppDatabase["transaction"]>[0]
>[0];

async function insertWords(
  tx: DbTransaction,
  activityId: string,
  wordInputs: WordInput[],
) {
  for (const [wordIndex, word] of wordInputs.entries()) {
    const [insertedWord] = await tx
      .insert(words)
      .values({
        activityId,
        english: word.english,
        position: wordIndex,
      })
      .returning({ id: words.id });

    if (!insertedWord) {
      throw new Error("Failed to insert word.");
    }

    if (word.phonemes.length > 0) {
      await tx.insert(wordPhonemes).values(
        word.phonemes.map((phoneme, phonemeIndex) => ({
          wordId: insertedWord.id,
          position: phonemeIndex,
          ipa: phoneme.ipa,
          grapheme: phoneme.grapheme,
          example: phoneme.example,
        })),
      );
    }
  }
}

function toValidatedSnapshot(
  activity: ActivityConfiguration,
): ValidatedCreateActivity {
  return {
    name: activity.name,
    activityType: activity.activityType,
    difficulty: activity.difficulty,
    showHints: activity.showHints,
    maxAttempts: activity.maxAttempts,
    seed: activity.seed,
    words: activity.words.map(({ english, phonemes }) => ({
      english,
      phonemes,
    })),
  };
}

async function loadActivity(
  id: string,
): Promise<ActivityConfiguration | null> {
  const db = getDb();
  const row = await db.query.activityConfigurations.findFirst({
    where: eq(activityConfigurations.id, id),
    with: {
      words: {
        orderBy: [asc(words.position)],
        with: {
          phonemes: {
            orderBy: [asc(wordPhonemes.position)],
          },
        },
      },
    },
  });

  return row ? mapActivity(row) : null;
}

export async function createActivity(
  input: CreateActivityInput,
): Promise<ActivityConfiguration> {
  const validated = validateCreateActivity(input);
  const db = getDb();

  const createdId = await db.transaction(async (tx) => {
    const [activity] = await tx
      .insert(activityConfigurations)
      .values({
        name: validated.name,
        activityType: validated.activityType,
        difficulty: validated.difficulty,
        showHints: validated.showHints,
        maxAttempts: validated.maxAttempts,
        seed: validated.seed,
      })
      .returning({ id: activityConfigurations.id });

    if (!activity) {
      throw new Error("Failed to create activity configuration.");
    }

    await insertWords(tx, activity.id, validated.words);
    return activity.id;
  });

  const loaded = await loadActivity(createdId);
  if (!loaded) {
    throw new Error("Created activity could not be loaded.");
  }
  return loaded;
}

export async function getActivity(
  id: string,
): Promise<ActivityConfiguration | null> {
  return loadActivity(id);
}

export async function listActivities(
  filter: ListActivitiesFilter = {},
): Promise<ActivitySummary[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: activityConfigurations.id,
      name: activityConfigurations.name,
      activityType: activityConfigurations.activityType,
      difficulty: activityConfigurations.difficulty,
      showHints: activityConfigurations.showHints,
      maxAttempts: activityConfigurations.maxAttempts,
      seed: activityConfigurations.seed,
      createdAt: activityConfigurations.createdAt,
      updatedAt: activityConfigurations.updatedAt,
      wordCount: count(words.id),
    })
    .from(activityConfigurations)
    .leftJoin(words, eq(words.activityId, activityConfigurations.id))
    .where(
      filter.activityType
        ? eq(activityConfigurations.activityType, filter.activityType)
        : undefined,
    )
    .groupBy(activityConfigurations.id)
    .orderBy(desc(activityConfigurations.createdAt));

  return rows.map((row) =>
    mapActivitySummary({
      ...row,
      wordCount: Number(row.wordCount),
    }),
  );
}

export async function updateActivity(
  id: string,
  patch: UpdateActivityInput,
): Promise<ActivityConfiguration> {
  const existing = await loadActivity(id);
  if (!existing) {
    throw new DalNotFoundError(`Activity configuration "${id}" not found.`);
  }

  const validated = validateUpdateActivity(
    existing.activityType,
    toValidatedSnapshot(existing),
    patch,
  );

  const db = getDb();
  await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(activityConfigurations)
      .set({
        name: validated.name,
        difficulty: validated.difficulty,
        showHints: validated.showHints,
        maxAttempts: validated.maxAttempts,
        seed: validated.seed,
        updatedAt: new Date(),
      })
      .where(eq(activityConfigurations.id, id))
      .returning({ id: activityConfigurations.id });

    if (!updated) {
      throw new DalNotFoundError(`Activity configuration "${id}" not found.`);
    }

    if (patch.words !== undefined) {
      await tx.delete(words).where(eq(words.activityId, id));
      await insertWords(tx, id, validated.words);
    }
  });

  const loaded = await loadActivity(id);
  if (!loaded) {
    throw new DalNotFoundError(`Activity configuration "${id}" not found.`);
  }
  return loaded;
}

export async function deleteActivity(id: string): Promise<void> {
  const db = getDb();
  const deleted = await db
    .delete(activityConfigurations)
    .where(eq(activityConfigurations.id, id))
    .returning({ id: activityConfigurations.id });

  if (deleted.length === 0) {
    throw new DalNotFoundError(`Activity configuration "${id}" not found.`);
  }
}

export async function ping(): Promise<boolean> {
  const db = getDb();
  await db.execute(sql`SELECT 1`);
  return true;
}
