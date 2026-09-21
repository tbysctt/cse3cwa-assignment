import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PhonemeWord } from "@/lib/phoneme-types";

const sampleWord: PhonemeWord = {
  id: "11111111-1111-4111-8111-111111111111",
  english: "quiz",
  phonemes: [
    { ipa: "k", grapheme: "K", example: "as in book" },
    { ipa: "w", grapheme: "W", example: "as in win" },
    { ipa: "ɪ", grapheme: "I", example: "as in bid" },
    { ipa: "z", grapheme: "Z", example: "as in zip" },
  ],
};

vi.mock("@/dal", async () => {
  const errors = await import("@/dal/errors");
  return {
    createWord: vi.fn(),
    updateWord: vi.fn(),
    deleteWord: vi.fn(),
    listWords: vi.fn(),
    findWordById: vi.fn(),
    DalNotFoundError: errors.DalNotFoundError,
    DalValidationError: errors.DalValidationError,
  };
});

import {
  createWord,
  deleteWord,
  listWords,
  updateWord,
  DalNotFoundError,
  DalValidationError,
} from "@/dal";
import {
  createWordAction,
  deleteWordAction,
  listWordsAction,
  updateWordAction,
} from "@/app/actions/words";

describe("word bank server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists words from the DAL", async () => {
    vi.mocked(listWords).mockResolvedValue([sampleWord]);
    const result = await listWordsAction();
    expect(result).toEqual({ ok: true, data: [sampleWord] });
  });

  it("creates a word", async () => {
    vi.mocked(createWord).mockResolvedValue(sampleWord);
    const result = await createWordAction({
      english: "quiz",
      phonemes: sampleWord.phonemes,
    });
    expect(result).toEqual({ ok: true, data: sampleWord });
  });

  it("updates a word by id", async () => {
    vi.mocked(updateWord).mockResolvedValue({
      ...sampleWord,
      english: "Quiz",
    });
    const result = await updateWordAction(sampleWord.id, {
      english: "Quiz",
      phonemes: sampleWord.phonemes,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.english).toBe("Quiz");
    }
  });

  it("deletes a word by id", async () => {
    vi.mocked(deleteWord).mockResolvedValue(undefined);
    const result = await deleteWordAction(sampleWord.id);
    expect(result).toEqual({ ok: true, data: { id: sampleWord.id } });
  });

  it("maps DalValidationError to ActionResult", async () => {
    vi.mocked(createWord).mockRejectedValue(
      new DalValidationError("English label is required.", "english"),
    );
    const result = await createWordAction({ english: "", phonemes: [] });
    expect(result).toEqual({
      ok: false,
      error: "English label is required.",
      field: "english",
    });
  });

  it("maps DalNotFoundError from update/delete", async () => {
    vi.mocked(updateWord).mockRejectedValue(
      new DalNotFoundError('Word “missing” not found.'),
    );
    vi.mocked(deleteWord).mockRejectedValue(
      new DalNotFoundError('Word “missing” not found.'),
    );

    const updateResult = await updateWordAction("missing", {
      english: "x",
      phonemes: sampleWord.phonemes,
    });
    expect(updateResult.ok).toBe(false);

    const deleteResult = await deleteWordAction("missing");
    expect(deleteResult.ok).toBe(false);
  });
});
