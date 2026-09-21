import { TEST_BUILDER_PROPS, TEST_WORD_SEARCH_PROPS } from "./fixtures";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WordSearchBuilder } from "@/components/word-search/WordSearchBuilder";
import { WordleBuilder } from "@/components/wordle/WordleBuilder";
import { downloadTextFile } from "@/lib/download";
import { wordsForLength } from "@/lib/phoneme-types";

vi.mock("@/lib/download", () => ({
  downloadTextFile: vi.fn(),
}));

vi.mock("@/app/actions/activities", () => ({
  listActivitiesAction: vi.fn(async () => ({ ok: true, data: [] })),
  getActivityAction: vi.fn(),
  createActivityAction: vi.fn(),
  updateActivityAction: vi.fn(),
  deleteActivityAction: vi.fn(),
  generateStoredActivityHtmlAction: vi.fn(),
}));

vi.mock("@/app/actions/corpus", () => ({
  createCorpusWordAction: vi.fn(async (input) => ({
    ok: true,
    data: {
      id: input.english.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      english: input.english,
      phonemes: input.phonemes,
    },
  })),
  updateCorpusWordAction: vi.fn(),
  deleteCorpusWordAction: vi.fn(async (id) => ({ ok: true, data: { id } })),
  listCorpusWordsAction: vi.fn(),
}));

import { createCorpusWordAction } from "@/app/actions/corpus";

describe("Word bank builder flows", () => {
  beforeEach(() => {
    vi.mocked(downloadTextFile).mockClear();
    vi.mocked(createCorpusWordAction).mockClear();
  });

  it("selects a bank word for Wordle and downloads HTML", async () => {
    const user = userEvent.setup();
    const firstThree = wordsForLength(TEST_BUILDER_PROPS.corpus, 3)[0]!;
    render(<WordleBuilder {...TEST_BUILDER_PROPS} />);

    expect(screen.getByRole("combobox", { name: "Target word" })).toHaveValue(
      firstThree.id,
    );
    expect(
      screen.queryByRole("button", { name: "Custom word entry" }),
    ).not.toBeInTheDocument();

    const generateBtn = screen.getByRole("button", {
      name: "Generate and download HTML",
    });
    expect(generateBtn).toBeEnabled();
    await user.click(generateBtn);

    expect(downloadTextFile).toHaveBeenCalledWith(
      "phoneme-wordle.html",
      expect.stringContaining("<!DOCTYPE html>"),
    );
    const html = vi.mocked(downloadTextFile).mock.calls[0][1] as string;
    expect(html).toContain(firstThree.english);
  });

  it("adds a word to the bank via the editor modal", async () => {
    const user = userEvent.setup();
    render(<WordleBuilder {...TEST_BUILDER_PROPS} />);

    await user.click(screen.getByRole("button", { name: "Add word" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Add word")).toBeInTheDocument();

    await user.type(
      within(dialog).getByPlaceholderText("e.g. ship"),
      "quiz",
    );
    await user.clear(
      within(dialog).getByPlaceholderText("e.g. /ʃ/ /ɪ/ /p/"),
    );
    await user.type(
      within(dialog).getByPlaceholderText("e.g. /ʃ/ /ɪ/ /p/"),
      "/k/ /w/ /ɪ/ /z/",
    );

    await user.click(
      within(dialog).getByRole("button", { name: "Save word" }),
    );
    expect(createCorpusWordAction).toHaveBeenCalled();
  });

  it("picks five bank words for Word Search and exports HTML", async () => {
    const user = userEvent.setup();
    render(<WordSearchBuilder {...TEST_WORD_SEARCH_PROPS} />);

    expect(
      screen.getByRole("list", { name: "Word search bank picks" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Custom words/i }),
    ).not.toBeInTheDocument();

    const generateBtn = screen.getByRole("button", {
      name: "Generate and download HTML",
    });
    expect(generateBtn).toBeEnabled();
    await user.click(generateBtn);
    expect(downloadTextFile).toHaveBeenCalledWith(
      "phoneme-word-search.html",
      expect.stringContaining("<!DOCTYPE html>"),
    );
  });

  it("shows the word bank list for Word Search", () => {
    render(<WordSearchBuilder {...TEST_WORD_SEARCH_PROPS} />);
    expect(screen.getByRole("list", { name: "Word bank" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add word" })).toBeInTheDocument();
  });
});
