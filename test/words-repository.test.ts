import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createWord,
  deleteWord,
  findWordById,
  listWords,
  ping,
  updateWord,
} from "@/dal";
import { DalNotFoundError, DalValidationError } from "@/dal/errors";

const databaseUrl = process.env.DATABASE_URL;
const describeRepo = databaseUrl ? describe : describe.skip;

const phonemes3 = [
  { ipa: "θ", grapheme: "TH", example: "as in thin" },
  { ipa: "ɪ", grapheme: "I", example: "as in thin" },
  { ipa: "n", grapheme: "N", example: "as in thin" },
];

const uuidRe =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describeRepo("word bank DAL CRUD (integration)", () => {
  const createdIds: string[] = [];
  const uniqueEnglish = () => `test-word-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  afterAll(async () => {
    for (const id of createdIds) {
      try {
        await deleteWord(id);
      } catch {
        // already deleted
      }
    }
  });

  beforeAll(async () => {
    await ping();
  });

  it("creates a word with a UUID id and round-trips CRUD", async () => {
    const english = uniqueEnglish();
    const created = await createWord({ english, phonemes: phonemes3 });
    createdIds.push(created.id);

    expect(created.id).toMatch(uuidRe);
    expect(created.id).not.toBe(english);
    expect(created.english).toBe(english);
    expect(created.phonemes.map((p) => p.ipa)).toEqual(["θ", "ɪ", "n"]);

    const listed = await listWords();
    expect(listed.some((word) => word.id === created.id)).toBe(true);

    const found = await findWordById(created.id);
    expect(found?.english).toBe(english);

    const updated = await updateWord(created.id, {
      english: `${english}-upd`,
      phonemes: phonemes3,
    });
    expect(updated.id).toBe(created.id);
    expect(updated.english).toBe(`${english}-upd`);

    await deleteWord(created.id);
    createdIds.pop();
    expect(await findWordById(created.id)).toBeNull();
  });

  it("rejects duplicate english labels", async () => {
    const english = uniqueEnglish();
    const created = await createWord({ english, phonemes: phonemes3 });
    createdIds.push(created.id);

    await expect(
      createWord({ english, phonemes: phonemes3 }),
    ).rejects.toBeInstanceOf(DalValidationError);

    try {
      await createWord({ english, phonemes: phonemes3 });
    } catch (error) {
      expect(error).toBeInstanceOf(DalValidationError);
      expect((error as DalValidationError).field).toBe("english");
    }
  });

  it("rejects invalid phoneme length", async () => {
    await expect(
      createWord({
        english: uniqueEnglish(),
        phonemes: phonemes3.slice(0, 2),
      }),
    ).rejects.toBeInstanceOf(DalValidationError);
  });

  it("throws DalNotFoundError for missing update/delete", async () => {
    const missing = "00000000-0000-4000-8000-000000000099";
    await expect(
      updateWord(missing, { english: "x", phonemes: phonemes3 }),
    ).rejects.toBeInstanceOf(DalNotFoundError);
    await expect(deleteWord(missing)).rejects.toBeInstanceOf(DalNotFoundError);
  });
});
