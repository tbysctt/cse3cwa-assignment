import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { HCE_PHONEME_INVENTORY,
  HCE_KEYBOARD_ROWS } from "@/data/phonemes";
// keyboardRows added below
import { parsePhonemeSequence } from "@/lib/custom-phonemes";
import { generateWordleHtml } from "@/lib/generate-wordle-html";
import { generateWordSearchHtml } from "@/lib/generate-word-search-html";
import { cellsForPlacement, generateWordSearch } from "@/lib/word-search";

describe("Custom activity standalone HTML exports", () => {
  it("plays a custom Wordle game to victory in standalone HTML", () => {
    const customTarget = {
      id: "cheese",
      english: "cheese",
      phonemes: parsePhonemeSequence("/tʃ/ /iː/ /z/"),
    };

    const html = generateWordleHtml({
      target: customTarget,
      inventory: HCE_PHONEME_INVENTORY,
      keyboardRows: HCE_KEYBOARD_ROWS,
      maxAttempts: 6,
      difficulty: "medium",
      showHints: true,
    });

    const dom = new JSDOM(html, { runScripts: "dangerously" });
    const buttons = [...dom.window.document.querySelectorAll(".key")];

    // Click target keys
    for (const phoneme of customTarget.phonemes) {
      const btn = buttons.find(
        (b) => b.getAttribute("aria-label")?.includes(`/${phoneme.ipa}/`),
      );
      expect(btn).toBeDefined();
      (btn as HTMLButtonElement).click();
    }

    (dom.window.document.getElementById("enter") as HTMLButtonElement).click();
    expect(dom.window.document.getElementById("status")?.textContent).toMatch(
      /Correct.*cheese/i,
    );
  });

  it("plays a custom Word Search game to match words in standalone HTML", () => {
    const customWords = [
      { id: "cat", english: "cat", phonemes: parsePhonemeSequence("/k/ /æ/ /t/") },
      { id: "dog", english: "dog", phonemes: parsePhonemeSequence("/d/ /ɔ/ /ɡ/") },
      { id: "fish", english: "fish", phonemes: parsePhonemeSequence("/f/ /ɪ/ /ʃ/") },
      { id: "frog", english: "frog", phonemes: parsePhonemeSequence("/f/ /ɹ/ /ɔ/ /ɡ/") },
      { id: "milk", english: "milk", phonemes: parsePhonemeSequence("/m/ /ɪ/ /l/ /k/") },
    ];

    const puzzle = generateWordSearch(customWords, 9, 42);
    const html = generateWordSearchHtml({
      words: customWords,
      puzzle,
      difficulty: "medium",
      showHints: true,
    });

    const dom = new JSDOM(html, { runScripts: "dangerously" });
    const placement = puzzle.placements[0];
    const keys = cellsForPlacement(placement);

    // Simulate keyboard selection workflow (detail 0)
    const keyboardClick = (key: string) => {
      const cell = dom.window.document.querySelector(
        `[data-key="${key}"]`,
      ) as HTMLButtonElement;
      cell.dispatchEvent(
        new dom.window.MouseEvent("click", { bubbles: true, detail: 0 }),
      );
      return cell;
    };

    keyboardClick(keys[0]);
    keyboardClick(keys[keys.length - 1]);

    expect(dom.window.document.getElementById("status")?.textContent).toMatch(
      new RegExp(`Found.*${placement.word.english}`, "i"),
    );
  });
});
