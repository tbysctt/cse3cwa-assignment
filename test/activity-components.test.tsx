import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { WordSearchGame } from "@/components/word-search/WordSearchGame";
import { PhonemeKeyboard } from "@/components/wordle/PhonemeKeyboard";
import { WordleConfigForm } from "@/components/wordle/WordleConfigForm";
import { WordleGame } from "@/components/wordle/WordleGame";
import { HCE_WORDS_3, HCE_WORDS_4, HCE_WORDS_5 } from "./fixtures";
import { HCE_KEYBOARD_ROWS, HCE_PHONEME_INVENTORY } from "./fixtures";
import {
  PHONEME_INVENTORY,
  WORDLE_TARGET,
  WORD_SEARCH_WORDS,
} from "./fixtures";
import {
  cellsForPlacement,
  generateWordSearch,
  INVALID_SELECTION_FLASH_MS,
} from "@/lib/word-search";

describe("PhonemeKeyboard", () => {
  it("renders the fixed HCE row order including blank slots", () => {
    render(
      <PhonemeKeyboard
        inventory={HCE_PHONEME_INVENTORY}
        keyboardRows={HCE_KEYBOARD_ROWS}
        showHint={false}
        onKeyPress={() => undefined}
      />,
    );
    const keyboard = screen.getByRole("group", { name: "Phoneme keyboard" });
    const rows = keyboard.querySelectorAll(":scope > div");
    expect(rows).toHaveLength(12);
    expect(within(rows[0] as HTMLElement).getByRole("button", { name: "/p/" })).toBeInTheDocument();
    expect(within(rows[0] as HTMLElement).getByRole("button", { name: "/t/" })).toBeInTheDocument();
    expect(within(rows[0] as HTMLElement).getByRole("button", { name: "/k/" })).toBeInTheDocument();
    expect(within(rows[1] as HTMLElement).getByRole("button", { name: "/ɡ/" })).toBeInTheDocument();
    expect(within(rows[6] as HTMLElement).getByRole("button", { name: "/tʃ/" })).toBeInTheDocument();
    const blankCount = [...rows].reduce((total, row) => {
      return (
        total +
        [...row.children].filter(
          (child) =>
            child instanceof HTMLElement &&
            child.tagName === "SPAN" &&
            child.getAttribute("aria-hidden") === "true" &&
            child.childElementCount === 0,
        ).length
      );
    }, 0);
    expect(blankCount).toBe(
      HCE_KEYBOARD_ROWS.flat().filter((slot) => slot === null).length,
    );
  });
});

describe("Wordle components", () => {
  it("plays a winning game and locks its controls", async () => {
    const user = userEvent.setup();
    render(
      <WordleGame
        target={WORDLE_TARGET}
        inventory={PHONEME_INVENTORY}
        keyboardRows={HCE_KEYBOARD_ROWS}
        maxAttempts={2}
        showHints={false}
      />,
    );

    for (const phoneme of WORDLE_TARGET.phonemes) {
      await user.click(
        screen.getByRole("button", { name: `/${phoneme.ipa}/` }),
      );
    }
    await user.click(screen.getByRole("button", { name: "Enter" }));

    expect(screen.getByRole("status")).toHaveTextContent(/correct/i);
    expect(screen.getByRole("button", { name: "Enter" })).toBeDisabled();
    expect(screen.queryByText("TH")).not.toBeInTheDocument();
  });

  it("supports four- and five-phoneme targets as one cell per phoneme", async () => {
    const user = userEvent.setup();
    const four = HCE_WORDS_4.find((word) => word.id === "stop")!;
    const { unmount } = render(
      <WordleGame
        key={four.id}
        target={four}
        inventory={PHONEME_INVENTORY}
        keyboardRows={HCE_KEYBOARD_ROWS}
        maxAttempts={2}
        showHints={false}
      />,
    );

    expect(screen.getByText("4 phonemes")).toBeInTheDocument();
    for (const phoneme of four.phonemes) {
      await user.click(screen.getByRole("button", { name: `/${phoneme.ipa}/` }));
    }
    await user.click(screen.getByRole("button", { name: "Enter" }));
    expect(screen.getByRole("status")).toHaveTextContent(/stop/i);

    unmount();
    const five = HCE_WORDS_5.find((word) => word.id === "stamp")!;
    render(
      <WordleGame
        key={five.id}
        target={five}
        inventory={PHONEME_INVENTORY}
        keyboardRows={HCE_KEYBOARD_ROWS}
        maxAttempts={2}
        showHints={false}
      />,
    );
    expect(screen.getByText("5 phonemes")).toBeInTheDocument();
    for (const phoneme of five.phonemes) {
      await user.click(screen.getByRole("button", { name: `/${phoneme.ipa}/` }));
    }
    await user.click(screen.getByRole("button", { name: "Enter" }));
    expect(screen.getByRole("status")).toHaveTextContent(/stamp/i);
  });

  it("reports incomplete guesses", async () => {
    const user = userEvent.setup();
    render(
      <WordleGame
        target={WORDLE_TARGET}
        inventory={PHONEME_INVENTORY}
        keyboardRows={HCE_KEYBOARD_ROWS}
        maxAttempts={2}
        showHints
      />,
    );
    await user.click(screen.getByRole("button", { name: "Enter" }));
    expect(screen.getByRole("status")).toHaveTextContent(/fill every/i);
  });

  it("does not steal Backspace while a config field is focused", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <input aria-label="Teacher note" defaultValue="abc" />
        <WordleGame
          target={WORDLE_TARGET}
          inventory={PHONEME_INVENTORY}
          keyboardRows={HCE_KEYBOARD_ROWS}
          maxAttempts={2}
          showHints={false}
        />
      </div>,
    );

    const note = screen.getByRole("textbox", { name: "Teacher note" });
    await user.click(note);
    await user.keyboard("{Backspace}");
    expect(note).toHaveValue("ab");
  });

  it("applies difficulty selection and shows preset summary", async () => {
    const user = userEvent.setup();
    const onDifficultyChange = vi.fn();
    const onLengthChange = vi.fn();
    const onWordIdChange = vi.fn();
    render(
      <WordleConfigForm
        length={3}
        onLengthChange={onLengthChange}
        wordId="thin"
        onWordIdChange={onWordIdChange}
        lengthWords={HCE_WORDS_3}
        difficulty="medium"
        onDifficultyChange={onDifficultyChange}
        canGenerate
        onGenerate={vi.fn()}
      />,
    );

    expect(screen.getByText(/\/θ\/ \/ɪ\/ \/n\//)).toBeInTheDocument();
    expect(screen.getByText(/6 guesses, hints on/i)).toBeInTheDocument();
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(screen.queryByText(/Show phoneme hints/i)).not.toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Target word" }),
      "ship",
    );
    expect(onWordIdChange).toHaveBeenCalledWith("ship");

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Phoneme length" }),
      "4",
    );
    expect(onLengthChange).toHaveBeenCalledWith(4);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Difficulty" }),
      "hard",
    );
    expect(onDifficultyChange).toHaveBeenCalledWith("hard");
  });
});

describe("WordSearchGame", () => {
  function gridButton(container: HTMLElement, key: string) {
    return container.querySelector(`[data-key="${key}"]`) as HTMLButtonElement;
  }

  function dragKeys(container: HTMLElement, keys: string[]) {
    fireEvent.pointerDown(gridButton(container, keys[0]), { button: 0 });
    for (const key of keys.slice(1)) {
      fireEvent.pointerEnter(gridButton(container, key));
    }
    fireEvent.pointerUp(document);
  }

  it("finds a word from a straight sequence and can reset", async () => {
    const user = userEvent.setup();
    const puzzle = generateWordSearch(WORD_SEARCH_WORDS, 9, 42);
    const { container } = render(
      <WordSearchGame
        puzzle={puzzle}
        words={WORD_SEARCH_WORDS}
        showHints={false}
      />,
    );
    const placement = puzzle.placements[0];
    const keys = cellsForPlacement(placement);

    dragKeys(container, keys);

    expect(screen.getByRole("status")).toHaveTextContent(
      new RegExp(placement.word.english, "i"),
    );
    expect(screen.queryByText(placement.word.phonemes[0].grapheme)).not.toBeInTheDocument();
    for (const key of keys) {
      expect(gridButton(container, key).getAttribute("aria-pressed")).toBe("false");
    }

    await user.click(screen.getByRole("button", { name: "Reset activity" }));
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    const list = screen.getByRole("list", { name: "Find these words" });
    expect(within(list).queryByText(/English:/)).not.toBeInTheDocument();
  });

  it("matches reverse and diagonal drag selections", () => {
    const puzzle = generateWordSearch(WORD_SEARCH_WORDS, 9, 42);
    const { container, unmount } = render(
      <WordSearchGame
        puzzle={puzzle}
        words={WORD_SEARCH_WORDS}
        showHints={false}
      />,
    );
    const placement = puzzle.placements[0];
    dragKeys(container, [...cellsForPlacement(placement)].reverse());
    expect(screen.getByRole("status")).toHaveTextContent(
      new RegExp(placement.word.english, "i"),
    );
    unmount();

    let diagonalPuzzle = puzzle;
    let diagonal = puzzle.placements.find(
      (entry) => entry.direction === "DR" || entry.direction === "DL",
    );
    for (let seed = 0; seed < 80 && !diagonal; seed += 1) {
      diagonalPuzzle = generateWordSearch(WORD_SEARCH_WORDS, 9, seed);
      diagonal = diagonalPuzzle.placements.find(
        (entry) => entry.direction === "DR" || entry.direction === "DL",
      );
    }
    expect(diagonal).toBeTruthy();
    const { container: diagonalContainer } = render(
      <WordSearchGame
        puzzle={diagonalPuzzle}
        words={WORD_SEARCH_WORDS}
        showHints={false}
      />,
    );
    dragKeys(diagonalContainer, cellsForPlacement(diagonal!));
    expect(screen.getByRole("status")).toHaveTextContent(
      new RegExp(diagonal!.word.english, "i"),
    );
  });

  it("ignores off-axis drag cells and flashes then clears non-matching lines", async () => {
    const puzzle = generateWordSearch(WORD_SEARCH_WORDS, 9, 42);
    const { container } = render(
      <WordSearchGame
        puzzle={puzzle}
        words={WORD_SEARCH_WORDS}
        showHints={false}
      />,
    );

    // 2-1 is not on a horizontal, vertical, or 45° line from 0-0.
    const start = "0-0";
    const mid = "0-1";
    const offAxis = "2-1";
    fireEvent.pointerDown(gridButton(container, start), { button: 0 });
    fireEvent.pointerEnter(gridButton(container, mid));
    fireEvent.pointerEnter(gridButton(container, offAxis));
    expect(gridButton(container, start).getAttribute("aria-pressed")).toBe("true");
    expect(gridButton(container, mid).getAttribute("aria-pressed")).toBe("true");
    expect(gridButton(container, offAxis).getAttribute("aria-pressed")).toBe(
      "false",
    );

    fireEvent.pointerUp(document);
    expect(gridButton(container, start).getAttribute("data-invalid")).toBe("true");
    expect(gridButton(container, mid).getAttribute("data-invalid")).toBe("true");
    expect(screen.getByRole("status")).toBeEmptyDOMElement();

    await waitFor(
      () => {
        expect(gridButton(container, start).getAttribute("aria-pressed")).toBe(
          "false",
        );
        expect(gridButton(container, mid).getAttribute("aria-pressed")).toBe(
          "false",
        );
        expect(gridButton(container, start).getAttribute("data-invalid")).toBeNull();
      },
      { timeout: INVALID_SELECTION_FLASH_MS + 200 },
    );
  });

  it("treats pointercancel like pointerup for invalid selections", async () => {
    const puzzle = generateWordSearch(WORD_SEARCH_WORDS, 9, 42);
    const { container } = render(
      <WordSearchGame
        puzzle={puzzle}
        words={WORD_SEARCH_WORDS}
        showHints={false}
      />,
    );
    fireEvent.pointerDown(gridButton(container, "0-0"), { button: 0 });
    fireEvent.pointerEnter(gridButton(container, "0-1"));
    fireEvent.pointerCancel(document);
    expect(gridButton(container, "0-0").getAttribute("data-invalid")).toBe("true");
    await waitFor(
      () => {
        expect(gridButton(container, "0-0").getAttribute("aria-pressed")).toBe(
          "false",
        );
      },
      { timeout: INVALID_SELECTION_FLASH_MS + 200 },
    );
  });

  it("clears a plain pointer click without matching or flashing", async () => {
    const user = userEvent.setup();
    const puzzle = generateWordSearch(WORD_SEARCH_WORDS, 9, 42);
    const { container } = render(
      <WordSearchGame
        puzzle={puzzle}
        words={WORD_SEARCH_WORDS}
        showHints={false}
      />,
    );
    const cell = gridButton(container, "0-0");

    await user.click(cell);

    expect(cell.getAttribute("aria-pressed")).toBe("false");
    expect(cell.getAttribute("data-invalid")).toBeNull();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();

    // A second click elsewhere must not build a line from a stale anchor.
    const other = gridButton(container, "0-1");
    await user.click(other);
    expect(cell.getAttribute("aria-pressed")).toBe("false");
    expect(other.getAttribute("aria-pressed")).toBe("false");
    expect(other.getAttribute("data-invalid")).toBeNull();
  });

  it("clears a press and release that never drags to a second cell", () => {
    const puzzle = generateWordSearch(WORD_SEARCH_WORDS, 9, 42);
    const { container } = render(
      <WordSearchGame
        puzzle={puzzle}
        words={WORD_SEARCH_WORDS}
        showHints={false}
      />,
    );
    const cell = gridButton(container, "0-0");

    fireEvent.pointerDown(cell, { button: 0 });
    expect(cell.getAttribute("aria-pressed")).toBe("true");

    fireEvent.pointerUp(document);
    expect(cell.getAttribute("aria-pressed")).toBe("false");
    expect(cell.getAttribute("data-invalid")).toBeNull();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("supports keyboard start and end selection for matches", () => {
    const puzzle = generateWordSearch(WORD_SEARCH_WORDS, 9, 42);
    const { container } = render(
      <WordSearchGame
        puzzle={puzzle}
        words={WORD_SEARCH_WORDS}
        showHints={false}
      />,
    );
    const placement = puzzle.placements[0];
    const keys = cellsForPlacement(placement);

    fireEvent.click(gridButton(container, keys[0]), { detail: 0 });
    expect(gridButton(container, keys[0]).getAttribute("aria-pressed")).toBe(
      "true",
    );

    fireEvent.click(gridButton(container, keys[keys.length - 1]), { detail: 0 });
    expect(screen.getByRole("status")).toHaveTextContent(
      new RegExp(placement.word.english, "i"),
    );
  });

  it("matches reverse keyboard selections and toggles off a repeated start", () => {
    const puzzle = generateWordSearch(WORD_SEARCH_WORDS, 9, 42);
    const { container } = render(
      <WordSearchGame
        puzzle={puzzle}
        words={WORD_SEARCH_WORDS}
        showHints={false}
      />,
    );
    const keys = cellsForPlacement(puzzle.placements[0]);

    const start = gridButton(container, keys[0]);
    fireEvent.click(start, { detail: 0 });
    fireEvent.click(start, { detail: 0 });
    expect(start.getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByRole("status")).toBeEmptyDOMElement();

    fireEvent.click(gridButton(container, keys[keys.length - 1]), { detail: 0 });
    fireEvent.click(gridButton(container, keys[0]), { detail: 0 });
    expect(screen.getByRole("status")).toHaveTextContent(
      new RegExp(puzzle.placements[0].word.english, "i"),
    );
  });

  it("flashes and clears off-axis keyboard selections", async () => {
    const puzzle = generateWordSearch(WORD_SEARCH_WORDS, 9, 42);
    const { container } = render(
      <WordSearchGame
        puzzle={puzzle}
        words={WORD_SEARCH_WORDS}
        showHints={false}
      />,
    );

    const first = gridButton(container, "0-0");
    const offAxis = gridButton(container, "1-2");
    fireEvent.click(first, { detail: 0 });
    fireEvent.click(offAxis, { detail: 0 });
    expect(first.getAttribute("data-invalid")).toBe("true");
    await waitFor(
      () => {
        expect(first.getAttribute("aria-pressed")).toBe("false");
      },
      { timeout: INVALID_SELECTION_FLASH_MS + 200 },
    );
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("shows short mouse and keyboard instructions", () => {
    const puzzle = generateWordSearch(WORD_SEARCH_WORDS, 9, 42);
    render(
      <WordSearchGame
        puzzle={puzzle}
        words={WORD_SEARCH_WORDS}
        showHints={false}
      />,
    );
    expect(screen.getByText(/Mouse or touch:/)).toBeInTheDocument();
    expect(screen.getByText(/Keyboard:/)).toBeInTheDocument();
    expect(
      screen.getByText(/press Enter or Space to set the start/i),
    ).toBeInTheDocument();
  });
});
