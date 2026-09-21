import { TEST_BUILDER_PROPS, TEST_WORD_SEARCH_PROPS } from "./fixtures";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WordSearchBuilder } from "@/components/word-search/WordSearchBuilder";
import { WordleBuilder } from "@/components/wordle/WordleBuilder";
import { downloadTextFile } from "@/lib/download";
import { DIFFICULTY_PRESETS } from "@/lib/wordle";
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

vi.mock("@/app/actions/words", () => ({
  createWordAction: vi.fn(),
  updateWordAction: vi.fn(),
  deleteWordAction: vi.fn(),
  listWordsAction: vi.fn(),
}));

describe("activity builders", () => {
  beforeEach(() => {
    vi.mocked(downloadTextFile).mockClear();
  });

  it("shows New activity as the configure panel title when unsaved", () => {
    render(<WordleBuilder {...TEST_BUILDER_PROPS} />);
    expect(
      screen.getByRole("heading", { level: 2, name: "New activity" }),
    ).toBeInTheDocument();
  });

  it("shows New activity on Word Search when unsaved", () => {
    render(<WordSearchBuilder {...TEST_WORD_SEARCH_PROPS} />);
    expect(
      screen.getByRole("heading", { level: 2, name: "New activity" }),
    ).toBeInTheDocument();
  });

  it("downloads a valid Wordle from the HCE corpus with difficulty presets", async () => {
    const user = userEvent.setup();
    const firstThree = wordsForLength(TEST_BUILDER_PROPS.words, 3)[0]!;
    const firstFive = wordsForLength(TEST_BUILDER_PROPS.words, 5)[0]!;
    render(<WordleBuilder {...TEST_BUILDER_PROPS} />);
    const generate = screen.getByRole("button", { name: "Generate and download HTML" });

    expect(screen.getByRole("combobox", { name: "Phoneme length" })).toHaveValue(
      "3",
    );
    expect(screen.getByRole("combobox", { name: "Target word" })).toHaveValue(
      firstThree.id,
    );
    expect(
      screen.getByText(
        (_, element) =>
          element?.textContent ===
          `Target: ${firstThree.phonemes.map((p) => `/${p.ipa}/`).join(" ")}`,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/6 guesses, hints on/i)).toBeInTheDocument();
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Phoneme length" }),
      "5",
    );
    expect(screen.getByRole("combobox", { name: "Target word" })).toHaveValue(
      firstFive.id,
    );

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Difficulty" }),
      "hard",
    );
    expect(screen.getByText(/5 guesses, hints off/i)).toBeInTheDocument();

    await user.click(generate);
    expect(downloadTextFile).toHaveBeenCalledWith(
      "phoneme-wordle.html",
      expect.stringContaining("<!DOCTYPE html>"),
    );
    const html = vi.mocked(downloadTextFile).mock.calls[0][1] as string;
    expect(html).toContain(firstFive.english);
    expect(html).toContain("key-row");
    expect(html).toContain(`Guesses: ${DIFFICULTY_PRESETS.hard.maxAttempts}`);
  });

  it("lets teachers pick five HCE corpus words for Word Search", async () => {
    const user = userEvent.setup();
    render(<WordSearchBuilder {...TEST_WORD_SEARCH_PROPS} />);
    const generate = screen.getByRole("button", { name: "Generate and download HTML" });

    expect(
      screen.getByRole("list", { name: "Word search bank picks" }),
    ).toBeInTheDocument();
    const defaultPicks = TEST_WORD_SEARCH_PROPS.words.slice(0, 5);
    for (const [index, word] of defaultPicks.entries()) {
      expect(
        screen.getByRole("combobox", { name: `Word ${index + 1}` }),
      ).toHaveValue(word.id);
    }
    expect(screen.getByRole("button", { name: "Create new" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /phonemes/i })).not.toBeInTheDocument();
    expect(screen.getByText(/9×9 grid, hints on/i)).toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Word 1" }),
      "zip",
    );
    expect(screen.getAllByText(/\/z\/ \/ɪ\/ \/p\//).length).toBeGreaterThan(0);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Difficulty" }),
      "hard",
    );
    expect(screen.getByText(/10×10 grid, hints off/i)).toBeInTheDocument();

    await user.click(generate);
    expect(downloadTextFile).toHaveBeenCalledWith(
      "phoneme-word-search.html",
      expect.stringContaining("<!DOCTYPE html>"),
    );
    const html = vi.mocked(downloadTextFile).mock.calls[0][1] as string;
    expect(html).toContain("bed");
    expect(generate).toBeEnabled();
  });
});
