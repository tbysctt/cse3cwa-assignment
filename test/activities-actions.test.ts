import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ActivityConfiguration } from "@/dal/types";

const sampleActivity: ActivityConfiguration = {
  id: "a1",
  name: "Thin",
  activityType: "wordle",
  difficulty: "medium",
  showHints: true,
  maxAttempts: 6,
  seed: null,
  words: [
    {
      id: "w1",
      english: "thin",
      phonemes: [
        { ipa: "θ", grapheme: "TH", example: "as in thin" },
        { ipa: "ɪ", grapheme: "I", example: "as in thin" },
        { ipa: "n", grapheme: "N", example: "as in thin" },
      ],
    },
  ],
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-02T00:00:00.000Z"),
};

vi.mock("@/dal", async () => {
  const errors = await import("@/dal/errors");
  const { HCE_KEYBOARD_ROWS, HCE_PHONEME_INVENTORY } = await import(
    "./fixtures"
  );
  return {
    createActivity: vi.fn(),
    getActivity: vi.fn(),
    listActivities: vi.fn(),
    updateActivity: vi.fn(),
    deleteActivity: vi.fn(),
    ping: vi.fn(),
    listPhonemeInventory: vi.fn(async () => HCE_PHONEME_INVENTORY),
    getKeyboardRows: vi.fn(async () => HCE_KEYBOARD_ROWS),
    listWords: vi.fn(async () => []),
    findWordById: vi.fn(async () => null),
    DalNotFoundError: errors.DalNotFoundError,
    DalValidationError: errors.DalValidationError,
  };
});

import {
  createActivity,
  deleteActivity,
  getActivity,
  listActivities,
  DalNotFoundError,
  DalValidationError,
} from "@/dal";
import {
  createActivityAction,
  deleteActivityAction,
  generateStoredActivityHtmlAction,
  getActivityAction,
  listActivitiesAction,
} from "@/app/actions/activities";

describe("activity server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("serialises activity dates as ISO strings", async () => {
    vi.mocked(getActivity).mockResolvedValue(sampleActivity);
    const result = await getActivityAction("a1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.createdAt).toBe("2026-01-01T00:00:00.000Z");
      expect(result.data.updatedAt).toBe("2026-01-02T00:00:00.000Z");
    }
  });

  it("maps DalValidationError to ActionResult", async () => {
    vi.mocked(createActivity).mockRejectedValue(
      new DalValidationError("bad name", "name"),
    );
    const result = await createActivityAction({
      name: "",
      activityType: "wordle",
      difficulty: "medium",
      showHints: true,
      maxAttempts: 6,
      words: [],
    });
    expect(result).toEqual({
      ok: false,
      error: "bad name",
      field: "name",
    });
  });

  it("maps missing activities to not-found ActionResult", async () => {
    vi.mocked(getActivity).mockResolvedValue(null);
    const result = await getActivityAction("missing");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/not found/i);
    }
  });

  it("maps DalNotFoundError from delete", async () => {
    vi.mocked(deleteActivity).mockRejectedValue(
      new DalNotFoundError('Activity configuration "x" not found.'),
    );
    const result = await deleteActivityAction("x");
    expect(result.ok).toBe(false);
  });

  it("generates HTML from a stored Wordle activity", async () => {
    vi.mocked(getActivity).mockResolvedValue(sampleActivity);
    const result = await generateStoredActivityHtmlAction("a1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.filename).toBe("phoneme-wordle.html");
      expect(result.data.html).toContain("<!DOCTYPE html>");
      expect(result.data.html).toContain("thin");
    }
  });

  it("lists summaries through the DAL", async () => {
    vi.mocked(listActivities).mockResolvedValue([
      {
        ...sampleActivity,
        wordCount: 1,
      },
    ]);
    const result = await listActivitiesAction("wordle");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].wordCount).toBe(1);
      expect(typeof result.data[0].createdAt).toBe("string");
    }
  });
});
