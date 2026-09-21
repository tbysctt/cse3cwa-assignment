import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createActivity,
  deleteActivity,
  getActivity,
  listActivities,
  ping,
  updateActivity,
} from "@/dal";
import { DalNotFoundError } from "@/dal/errors";

const databaseUrl = process.env.DATABASE_URL;
const describeRepo = databaseUrl ? describe : describe.skip;

const phonemes = [
  { ipa: "θ", grapheme: "TH", example: "as in thin" },
  { ipa: "ɪ", grapheme: "I", example: "as in thin" },
  { ipa: "n", grapheme: "N", example: "as in thin" },
];

describeRepo("activity DAL CRUD (integration)", () => {
  const createdIds: string[] = [];

  afterAll(async () => {
    for (const id of createdIds) {
      try {
        await deleteActivity(id);
      } catch {
        // already deleted
      }
    }
  });

  beforeAll(async () => {
    await ping();
  });

  it("round-trips create, get, list, update, and delete", async () => {
    const created = await createActivity({
      name: `test-wordle-${Date.now()}`,
      activityType: "wordle",
      difficulty: "medium",
      showHints: true,
      maxAttempts: 6,
      words: [{ english: "thin", phonemes }],
    });
    createdIds.push(created.id);

    const loaded = await getActivity(created.id);
    expect(loaded?.words).toHaveLength(1);
    expect(loaded?.words[0].phonemes.map((p) => p.ipa)).toEqual([
      "θ",
      "ɪ",
      "n",
    ]);

    const listed = await listActivities({ activityType: "wordle" });
    expect(listed.some((row) => row.id === created.id)).toBe(true);

    const updated = await updateActivity(created.id, {
      name: `${created.name}-updated`,
      maxAttempts: 8,
    });
    expect(updated.name).toBe(`${created.name}-updated`);
    expect(updated.maxAttempts).toBe(8);

    await deleteActivity(created.id);
    createdIds.pop();
    expect(await getActivity(created.id)).toBeNull();
  });

  it("throws DalNotFoundError for missing update/delete", async () => {
    await expect(
      updateActivity("00000000-0000-4000-8000-000000000000", { name: "x" }),
    ).rejects.toBeInstanceOf(DalNotFoundError);
    await expect(
      deleteActivity("00000000-0000-4000-8000-000000000000"),
    ).rejects.toBeInstanceOf(DalNotFoundError);
  });
});
