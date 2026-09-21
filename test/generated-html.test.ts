import { JSDOM } from "jsdom";
import { describe, expect, it, vi } from "vitest";
import { HCE_WORDS_4, HCE_WORDS_5 } from "./fixtures";
import {
  HCE_KEYBOARD_ROWS,
  HCE_PHONEME_INVENTORY,
} from "./fixtures";
import {
  PHONEME_INVENTORY,
  WORDLE_TARGET,
  WORD_SEARCH_WORDS,
} from "./fixtures";
import { generateWordSearchHtml } from "@/lib/generate-word-search-html";
import { generateWordleHtml } from "@/lib/generate-wordle-html";
import { escapeHtml, toJson } from "@/lib/html";
import {
  cellsForPlacement,
  generateWordSearch,
  INVALID_SELECTION_FLASH_MS,
} from "@/lib/word-search";

describe("HTML utilities", () => {
  it("escapes markup-sensitive text", () => {
    expect(escapeHtml('&<>"')).toBe("&amp;&lt;&gt;&quot;");
  });

  it("serializes data without ending a script block", () => {
    const serialized = toJson({ value: "</script>\u2028\u2029" });
    expect(serialized).not.toContain("</script>");
    expect(serialized).toContain("\\u003c/script>");
    expect(serialized).toContain("\\u2028");
    expect(serialized).toContain("\\u2029");
  });
});

describe("standalone activity generators", () => {
  it("validates Wordle settings", () => {
    expect(() =>
      generateWordleHtml({
        target: { ...WORDLE_TARGET, phonemes: [] },
        inventory: PHONEME_INVENTORY,
        keyboardRows: HCE_KEYBOARD_ROWS,
        maxAttempts: 6,
        difficulty: "medium",
        showHints: true,
      }),
    ).toThrow(/phoneme target/i);

    expect(() =>
      generateWordleHtml({
        target: WORDLE_TARGET,
        inventory: PHONEME_INVENTORY,
        keyboardRows: HCE_KEYBOARD_ROWS,
        maxAttempts: Number.POSITIVE_INFINITY,
        difficulty: "medium",
        showHints: true,
      }),
    ).toThrow(/attempts/i);
  });

  it("renders untrusted Wordle phoneme metadata as text", () => {
    const hostile = {
      ipa: "<img src=x>",
      grapheme: "<svg/onload=alert(1)>",
      example: "</script><script>alert(1)</script>",
    };
    const html = generateWordleHtml({
      target: { id: "hostile", english: "<b>answer</b>", phonemes: [hostile] },
      inventory: [hostile],
      keyboardRows: HCE_KEYBOARD_ROWS,
      maxAttempts: 1,
      difficulty: "hard",
      showHints: true,
    });
    const dom = new JSDOM(html, { runScripts: "dangerously" });

    expect(dom.window.document.querySelectorAll("script")).toHaveLength(1);
    expect(dom.window.document.querySelector("img")).toBeNull();
    expect(dom.window.document.querySelector("svg")).toBeNull();
    expect(dom.window.document.querySelector(".key")?.textContent).toContain(
      hostile.ipa,
    );
  });

  it("uses the difficulty grid size and renders English labels safely", () => {
    const words = WORD_SEARCH_WORDS.map((word, index) =>
      index === 0
        ? { ...word, english: '<img src=x onerror="alert(1)">' }
        : word,
    );
    const html = generateWordSearchHtml({
      words,
      difficulty: "hard",
      showHints: false,
      seed: 42,
    });
    const dom = new JSDOM(html, { runScripts: "dangerously" });

    expect(dom.window.document.querySelectorAll(".cell")).toHaveLength(100);
    expect(dom.window.document.querySelector("img")).toBeNull();
    expect(dom.window.document.querySelector(".list")?.textContent).toContain(
      words[0].english,
    );
    expect(dom.window.document.querySelector(".cell .g")).toBeNull();
    expect(dom.window.document.getElementById("reset")).not.toBeNull();
  });

  it("keeps standalone Wordle scoring playable with the HCE keyboard layout", () => {
    const html = generateWordleHtml({
      target: WORDLE_TARGET,
      inventory: HCE_PHONEME_INVENTORY,
      keyboardRows: HCE_KEYBOARD_ROWS,
      maxAttempts: 2,
      difficulty: "medium",
      showHints: false,
    });
    const dom = new JSDOM(html, { runScripts: "dangerously" });
    expect(dom.window.document.querySelectorAll(".key-row")).toHaveLength(
      HCE_KEYBOARD_ROWS.length,
    );
    expect(
      dom.window.document.getElementById("board")?.getAttribute("role"),
    ).toBe("grid");
    const buttons = [...dom.window.document.querySelectorAll(".key")];
    for (const targetPhoneme of WORDLE_TARGET.phonemes) {
      const button = buttons.find(
        (candidate) =>
          candidate.getAttribute("aria-label") === `/${targetPhoneme.ipa}/`,
      );
      (button as HTMLButtonElement).click();
    }
    (dom.window.document.getElementById("enter") as HTMLButtonElement).click();
    expect(dom.window.document.getElementById("status")).toHaveTextContent(
      /correct/i,
    );
  });

  it("plays four- and five-phoneme standalone Wordle boards", () => {
    const four = HCE_WORDS_4.find((word) => word.id === "stop")!;
    const fourHtml = generateWordleHtml({
      target: four,
      inventory: HCE_PHONEME_INVENTORY,
      keyboardRows: HCE_KEYBOARD_ROWS,
      maxAttempts: 1,
      difficulty: "hard",
      showHints: false,
    });
    const fourDom = new JSDOM(fourHtml, { runScripts: "dangerously" });
    const fourButtons = [...fourDom.window.document.querySelectorAll(".key")];
    for (const phoneme of four.phonemes) {
      const button = fourButtons.find(
        (candidate) =>
          candidate.getAttribute("aria-label") === `/${phoneme.ipa}/`,
      );
      (button as HTMLButtonElement).click();
    }
    (
      fourDom.window.document.getElementById("enter") as HTMLButtonElement
    ).click();
    expect(fourDom.window.document.getElementById("status")).toHaveTextContent(
      /correct/i,
    );

    const five = HCE_WORDS_5.find((word) => word.id === "street")!;
    const fiveHtml = generateWordleHtml({
      target: five,
      inventory: HCE_PHONEME_INVENTORY,
      keyboardRows: HCE_KEYBOARD_ROWS,
      maxAttempts: 1,
      difficulty: "hard",
      showHints: false,
    });
    const fiveDom = new JSDOM(fiveHtml, { runScripts: "dangerously" });
    const fiveButtons = [...fiveDom.window.document.querySelectorAll(".key")];
    for (const phoneme of five.phonemes) {
      const button = fiveButtons.find(
        (candidate) =>
          candidate.getAttribute("aria-label") === `/${phoneme.ipa}/`,
      );
      (button as HTMLButtonElement).click();
    }
    (
      fiveDom.window.document.getElementById("enter") as HTMLButtonElement
    ).click();
    expect(fiveDom.window.document.getElementById("status")).toHaveTextContent(
      /correct/i,
    );
  });

  it("keeps standalone Word Search matching and reset playable", () => {
    const puzzle = generateWordSearch(WORD_SEARCH_WORDS, 9, 42);
    const html = generateWordSearchHtml({
      words: WORD_SEARCH_WORDS,
      puzzle,
      difficulty: "medium",
      showHints: false,
    });
    const dom = new JSDOM(html, { runScripts: "dangerously" });
    const placement = puzzle.placements[0];
    const keys = cellsForPlacement(placement);
    const first = dom.window.document.querySelector(
      `[data-key="${keys[0]}"]`,
    ) as HTMLButtonElement;
    first.dispatchEvent(
      new dom.window.PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        pointerId: 1,
      }),
    );
    for (const key of keys.slice(1)) {
      (
        dom.window.document.querySelector(
          `[data-key="${key}"]`,
        ) as HTMLButtonElement
      ).dispatchEvent(
        new dom.window.PointerEvent("pointerenter", {
          bubbles: true,
          button: 0,
          pointerId: 1,
        }),
      );
    }
    dom.window.document.dispatchEvent(
      new dom.window.PointerEvent("pointerup", {
        bubbles: true,
        button: 0,
        pointerId: 1,
      }),
    );
    expect(dom.window.document.getElementById("status")).toHaveTextContent(
      placement.word.english,
    );
    (dom.window.document.getElementById("reset") as HTMLButtonElement).click();
    expect(dom.window.document.getElementById("status")).toBeEmptyDOMElement();
  });

  it("flashes and clears invalid standalone Word Search selections", async () => {
    const puzzle = generateWordSearch(WORD_SEARCH_WORDS, 9, 42);
    const html = generateWordSearchHtml({
      words: WORD_SEARCH_WORDS,
      puzzle,
      difficulty: "medium",
      showHints: false,
    });
    const dom = new JSDOM(html, {
      runScripts: "dangerously",
      pretendToBeVisual: true,
    });
    const start = dom.window.document.querySelector(
      '[data-key="0-0"]',
    ) as HTMLButtonElement;
    const mid = dom.window.document.querySelector(
      '[data-key="0-1"]',
    ) as HTMLButtonElement;
    const offAxis = dom.window.document.querySelector(
      '[data-key="2-1"]',
    ) as HTMLButtonElement;

    start.dispatchEvent(
      new dom.window.PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        pointerId: 1,
      }),
    );
    mid.dispatchEvent(
      new dom.window.PointerEvent("pointerenter", {
        bubbles: true,
        button: 0,
        pointerId: 1,
      }),
    );
    offAxis.dispatchEvent(
      new dom.window.PointerEvent("pointerenter", {
        bubbles: true,
        button: 0,
        pointerId: 1,
      }),
    );
    expect(offAxis.classList.contains("selected")).toBe(false);

    dom.window.document.dispatchEvent(
      new dom.window.PointerEvent("pointerup", {
        bubbles: true,
        button: 0,
        pointerId: 1,
      }),
    );
    expect(start.classList.contains("invalid")).toBe(true);
    expect(mid.classList.contains("invalid")).toBe(true);
    expect(dom.window.document.getElementById("status")).toBeEmptyDOMElement();

    await vi.waitFor(
      () => {
        expect(start.classList.contains("selected")).toBe(false);
        expect(start.classList.contains("invalid")).toBe(false);
      },
      { timeout: INVALID_SELECTION_FLASH_MS + 200 },
    );
  });

  it("matches reverse standalone Word Search drags and handles pointercancel", async () => {
    const puzzle = generateWordSearch(WORD_SEARCH_WORDS, 9, 42);
    const html = generateWordSearchHtml({
      words: WORD_SEARCH_WORDS,
      puzzle,
      difficulty: "medium",
      showHints: false,
    });
    const dom = new JSDOM(html, {
      runScripts: "dangerously",
      pretendToBeVisual: true,
    });
    const keys = [...cellsForPlacement(puzzle.placements[0])].reverse();
    const first = dom.window.document.querySelector(
      `[data-key="${keys[0]}"]`,
    ) as HTMLButtonElement;
    first.dispatchEvent(
      new dom.window.PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        pointerId: 1,
      }),
    );
    for (const key of keys.slice(1)) {
      (
        dom.window.document.querySelector(
          `[data-key="${key}"]`,
        ) as HTMLButtonElement
      ).dispatchEvent(
        new dom.window.PointerEvent("pointerenter", {
          bubbles: true,
          button: 0,
          pointerId: 1,
        }),
      );
    }
    dom.window.document.dispatchEvent(
      new dom.window.PointerEvent("pointerup", {
        bubbles: true,
        button: 0,
        pointerId: 1,
      }),
    );
    expect(dom.window.document.getElementById("status")).toHaveTextContent(
      puzzle.placements[0].word.english,
    );

    const start = dom.window.document.querySelector(
      '[data-key="0-0"]',
    ) as HTMLButtonElement;
    const mid = dom.window.document.querySelector(
      '[data-key="0-1"]',
    ) as HTMLButtonElement;
    start.dispatchEvent(
      new dom.window.PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        pointerId: 1,
      }),
    );
    mid.dispatchEvent(
      new dom.window.PointerEvent("pointerenter", {
        bubbles: true,
        button: 0,
        pointerId: 1,
      }),
    );
    dom.window.document.dispatchEvent(
      new dom.window.PointerEvent("pointercancel", {
        bubbles: true,
        button: 0,
        pointerId: 1,
      }),
    );
    expect(start.classList.contains("invalid")).toBe(true);
    await vi.waitFor(
      () => {
        expect(start.classList.contains("selected")).toBe(false);
      },
      { timeout: INVALID_SELECTION_FLASH_MS + 200 },
    );
  });

  it("clears standalone pointer presses that never drag to a second cell", () => {
    const puzzle = generateWordSearch(WORD_SEARCH_WORDS, 9, 42);
    const html = generateWordSearchHtml({
      words: WORD_SEARCH_WORDS,
      puzzle,
      difficulty: "medium",
      showHints: false,
    });
    const dom = new JSDOM(html, {
      runScripts: "dangerously",
      pretendToBeVisual: true,
    });
    const cell = dom.window.document.querySelector(
      '[data-key="0-0"]',
    ) as HTMLButtonElement;

    cell.dispatchEvent(
      new dom.window.PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        pointerId: 1,
      }),
    );
    expect(cell.classList.contains("selected")).toBe(true);

    dom.window.document.dispatchEvent(
      new dom.window.PointerEvent("pointerup", {
        bubbles: true,
        button: 0,
        pointerId: 1,
      }),
    );
    expect(cell.classList.contains("selected")).toBe(false);
    expect(cell.classList.contains("invalid")).toBe(false);
    expect(dom.window.document.getElementById("status")).toBeEmptyDOMElement();

    // A plain mouse click must not build a sticky anchor.
    cell.click();
    expect(cell.classList.contains("selected")).toBe(false);
  });

  it("supports standalone keyboard start and end selection with instructions", () => {
    const puzzle = generateWordSearch(WORD_SEARCH_WORDS, 9, 42);
    const html = generateWordSearchHtml({
      words: WORD_SEARCH_WORDS,
      puzzle,
      difficulty: "medium",
      showHints: false,
    });
    const dom = new JSDOM(html, {
      runScripts: "dangerously",
      pretendToBeVisual: true,
    });
    const howTo = dom.window.document.querySelector(".how-to");
    expect(howTo?.textContent).toContain("Mouse or touch:");
    expect(howTo?.textContent).toContain("Keyboard:");

    const keys = cellsForPlacement(puzzle.placements[0]);
    const keyboardClick = (key: string) => {
      const cell = dom.window.document.querySelector(
        `[data-key="${key}"]`,
      ) as HTMLButtonElement;
      cell.dispatchEvent(
        new dom.window.MouseEvent("click", { bubbles: true, detail: 0 }),
      );
      return cell;
    };

    const start = keyboardClick(keys[0]);
    expect(start.classList.contains("selected")).toBe(true);
    keyboardClick(keys[keys.length - 1]);
    expect(dom.window.document.getElementById("status")).toHaveTextContent(
      puzzle.placements[0].word.english,
    );
  });
});
