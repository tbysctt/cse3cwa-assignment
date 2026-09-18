import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WordSearchBuilder } from "@/components/word-search/WordSearchBuilder";
import { WordleBuilder } from "@/components/wordle/WordleBuilder";
import { WORD_SEARCH_WORDS } from "@/data/phonemes";
import { downloadTextFile } from "@/lib/download";
import { DIFFICULTY_PRESETS } from "@/lib/wordle";

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

describe("activity builders", () => {
  beforeEach(() => {
    vi.mocked(downloadTextFile).mockClear();
  });

  it("downloads a valid Wordle from the HCE corpus with difficulty presets", async () => {
    const user = userEvent.setup();
    render(<WordleBuilder />);
    const generate = screen.getByRole("button", { name: "Generate HTML" });

    expect(screen.getByRole("combobox", { name: "Phoneme length" })).toHaveValue(
      "3",
    );
    expect(screen.getByRole("combobox", { name: "Corpus word" })).toHaveValue(
      "thin",
    );
    expect(screen.getByText(/\/θ\/ \/ɪ\/ \/n\//)).toBeInTheDocument();
    expect(screen.getByText(/6 guesses, hints on/i)).toBeInTheDocument();
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Phoneme length" }),
      "5",
    );
    expect(screen.getByRole("combobox", { name: "Corpus word" })).toHaveValue(
      "stamp",
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
    expect(html).toContain("stamp");
    expect(html).toContain("key-row");
    expect(html).toContain(`Guesses: ${DIFFICULTY_PRESETS.hard.maxAttempts}`);
  });

  it("lets teachers pick five HCE corpus words for Word Search", async () => {
    const user = userEvent.setup();
    render(<WordSearchBuilder />);
    const generate = screen.getByRole("button", { name: "Generate HTML" });

    expect(
      screen.getByRole("list", { name: "Word search corpus picks" }),
    ).toBeInTheDocument();
    for (const [index, word] of WORD_SEARCH_WORDS.entries()) {
      expect(
        screen.getByRole("combobox", { name: `Word ${index + 1}` }),
      ).toHaveValue(word.id);
    }
    expect(screen.queryByRole("textbox", { name: "Activity name" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /phonemes/i })).not.toBeInTheDocument();
    expect(screen.getByText(/9×9 grid, hints on/i)).toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Word 1" }),
      "bed",
    );
    expect(screen.getByText(/\/b\/ \/e\/ \/d\//)).toBeInTheDocument();

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
