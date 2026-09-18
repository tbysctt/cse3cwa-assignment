import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WordSearchBuilder } from "@/components/word-search/WordSearchBuilder";
import { WordleBuilder } from "@/components/wordle/WordleBuilder";
import { downloadTextFile } from "@/lib/download";

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

describe("Custom input builder flows", () => {
  beforeEach(() => {
    vi.mocked(downloadTextFile).mockClear();
  });

  it("creates a custom Wordle activity, previews it, and downloads standalone HTML", async () => {
    const user = userEvent.setup();
    render(<WordleBuilder />);

    // Switch to custom word mode
    const customModeBtn = screen.getByRole("button", {
      name: "Custom word entry",
    });
    await user.click(customModeBtn);

    // English answer and phoneme text inputs should now be present
    const englishInput = screen.getByRole("textbox", {
      name: "English answer",
    });
    expect(englishInput).toHaveValue("cat");

    // Click quick sample "cheese"
    const cheesePreset = screen.getByRole("button", { name: "cheese" });
    await user.click(cheesePreset);
    expect(englishInput).toHaveValue("cheese");

    // Click "Generate HTML"
    const generateBtn = screen.getByRole("button", { name: "Generate HTML" });
    expect(generateBtn).toBeEnabled();
    await user.click(generateBtn);

    expect(downloadTextFile).toHaveBeenCalledWith(
      "phoneme-wordle.html",
      expect.stringContaining("<!DOCTYPE html>"),
    );
    const html = vi.mocked(downloadTextFile).mock.calls[0][1] as string;
    expect(html).toContain("cheese");
    expect(html).toContain("tʃ");
  });

  it("handles custom phoneme palette appending and error states in Wordle", async () => {
    const user = userEvent.setup();
    render(<WordleBuilder />);

    await user.click(screen.getByRole("button", { name: "Custom word entry" }));
    const englishInput = screen.getByRole("textbox", {
      name: "English answer",
    });

    // Clear English answer to trigger validation error
    await user.clear(englishInput);
    const generateBtn = screen.getByRole("button", { name: "Generate HTML" });
    expect(generateBtn).toBeDisabled();
    expect(screen.getByText(/Please enter an English word/i)).toBeInTheDocument();

    // Restore English and append phoneme from palette
    await user.type(englishInput, "cup");
    // Clear existing phonemes
    await user.click(screen.getByRole("button", { name: "Clear all" }));
    expect(generateBtn).toBeDisabled();

    // Click palette sounds
    const kBtn = screen.getByRole("button", { name: "/k/ → K (as in book)" });
    await user.click(kBtn);
    expect(generateBtn).toBeEnabled();
  });

  it("creates a custom Word Search activity, validates grid constraints, and exports HTML", async () => {
    const user = userEvent.setup();
    render(<WordSearchBuilder />);

    // Switch to custom words mode
    const customModeBtn = screen.getByRole("button", {
      name: "Custom words (5 words)",
    });
    await user.click(customModeBtn);

    // Slot inputs should be visible
    const word1English = screen.getByRole("textbox", {
      name: "Word 1 English",
    });
    expect(word1English).toBeInTheDocument();

    // Click "Load sample words"
    const sampleBtn = screen.getByRole("button", { name: "Load sample words" });
    await user.click(sampleBtn);

    const generateBtn = screen.getByRole("button", { name: "Generate HTML" });
    expect(generateBtn).toBeEnabled();

    await user.click(generateBtn);
    expect(downloadTextFile).toHaveBeenCalledWith(
      "phoneme-word-search.html",
      expect.stringContaining("<!DOCTYPE html>"),
    );
    const html = vi.mocked(downloadTextFile).mock.calls[0][1] as string;
    expect(html).toContain("cat");
    expect(html).toContain("fish");
  });

  it("validates oversize custom words against grid dimensions in Word Search", async () => {
    const user = userEvent.setup();
    render(<WordSearchBuilder />);

    await user.click(
      screen.getByRole("button", { name: "Custom words (5 words)" }),
    );

    // Set difficulty to Easy (8x8 grid)
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Difficulty" }),
      "easy",
    );

    // Enter a word with 9 phonemes for Word 1
    const word1Phonemes = screen.getByRole("textbox", {
      name: "Word 1 phonemes",
    });
    await user.clear(word1Phonemes);
    await user.type(
      word1Phonemes,
      "/p/ /t/ /k/ /b/ /d/ /f/ /s/ /m/ /n/",
    );

    expect(
      screen.getAllByText(/exceeds the 8 maximum/i).length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("button", { name: "Generate HTML" })).toBeDisabled();
  });
});
