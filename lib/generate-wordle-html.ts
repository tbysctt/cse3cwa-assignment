import type {
  KeyboardSlot,
  Phoneme,
  PhonemeWord,
} from "@/lib/phoneme-types";
import type { Difficulty } from "@/lib/activity";
import { escapeHtml, toJson } from "@/lib/html";
import {
  MAX_MAX_ATTEMPTS,
  MIN_MAX_ATTEMPTS,
} from "@/lib/wordle";

export type WordleActivitySettings = {
  target: PhonemeWord;
  inventory: Phoneme[];
  keyboardRows: KeyboardSlot[][];
  maxAttempts: number;
  difficulty: Difficulty;
  showHints: boolean;
};

export function generateWordleHtml(options: WordleActivitySettings): string {
  const {
    target,
    inventory,
    keyboardRows,
    maxAttempts,
    difficulty,
    showHints,
  } = options;
  if (!target.english.trim() || target.phonemes.length === 0) {
    throw new Error("Wordle activities need an English answer and phoneme target.");
  }
  if (
    !Number.isInteger(maxAttempts) ||
    maxAttempts < MIN_MAX_ATTEMPTS ||
    maxAttempts > MAX_MAX_ATTEMPTS
  ) {
    throw new Error(
      `Wordle attempts must be an integer from ${MIN_MAX_ATTEMPTS} to ${MAX_MAX_ATTEMPTS}.`,
    );
  }
  if (inventory.length === 0) {
    throw new Error("Wordle activities need at least one keyboard phoneme.");
  }
  if (keyboardRows.length === 0) {
    throw new Error("Wordle activities need a keyboard layout.");
  }
  const title = "PHONEME'LE";
  const length = target.phonemes.length;

  const dataJson = toJson({
    english: target.english,
    target: target.phonemes,
    inventory,
    keyboardRows,
    maxAttempts,
    length,
    showHints,
    difficulty,
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>
  :root {
    --bg: #f4f7fb; --fg: #1a2332; --surface: #fff; --border: #c5d0e0;
    --accent: #1d4ed8; --correct: #15803d; --present: #a16207; --absent: #64748b;
    --correct-ink: #ffffff; --present-ink: #ffffff; --absent-ink: #eef2f4;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; font-family: "Noto Sans", system-ui, sans-serif;
    background: var(--bg); color: var(--fg); line-height: 1.5;
  }
  main { max-width: 56rem; margin: 0 auto; padding: 1.5rem 1rem 3rem; }
  h1 { font-size: 1.5rem; letter-spacing: 0.04em; margin: 0 0 0.5rem; text-align: center; }
  .meta { color: #64748b; font-size: 0.95rem; margin-bottom: 1.25rem; text-align: center; }
  .settings {
    display: inline-flex; flex-wrap: wrap; gap: 0.4rem 0.9rem;
    margin: 0 auto 1.25rem; font-size: 0.85rem; color: #64748b;
    justify-content: center; width: 100%;
  }
  .settings span { background: var(--surface); border: 1px solid var(--border); border-radius: 999px; padding: 0.2rem 0.6rem; }
  .legend {
    display: flex; flex-wrap: wrap; gap: 0.75rem; margin: 1rem 0;
    font-size: 0.8rem; color: #64748b;
  }
  .legend .swatch { display: inline-flex; align-items: center; gap: 0.3rem; }
  .legend .dot {
    width: 0.85rem; height: 0.85rem; border-radius: 0.2rem; display: inline-block;
  }
  .legend .dot-correct { background: var(--correct); }
  .legend .dot-present { background: var(--present); background-image: repeating-linear-gradient(45deg, rgba(255,255,255,0.25) 0 2px, transparent 2px 4px); }
  .legend .dot-absent { background: var(--absent); opacity: 0.45; }
  .layout {
    display: grid; gap: 1.5rem; align-items: start;
  }
  @media (min-width: 1024px) {
    .layout { grid-template-columns: minmax(0, 1fr) minmax(16rem, 20rem); }
  }
  .board { display: grid; gap: 0.4rem; }
  .row {
    display: grid; gap: 0.4rem;
    grid-template-columns: repeat(${length}, minmax(2.5rem, 1fr));
  }
  .tile {
    min-height: 3rem; border: 2px solid var(--border); border-radius: 0.4rem;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    font-family: ui-monospace, monospace; background: var(--surface); position: relative;
  }
  .tile .g { font-size: 0.65rem; font-family: system-ui, sans-serif; color: #64748b; margin-top: 0.15rem; }
  .tile.correct { background: var(--correct); color: var(--correct-ink); border-color: var(--correct); }
  .tile.present {
    background: var(--present); color: var(--present-ink); border-color: var(--present);
    background-image: repeating-linear-gradient(45deg, rgba(255,255,255,0.22) 0 5px, transparent 5px 10px);
  }
  .tile.absent { background: var(--absent); color: var(--absent-ink); border-color: var(--absent); opacity: 0.85; }
  .tile.pending { animation: pop 0.12s ease; }
  @keyframes pop { from { transform: scale(0.9); } to { transform: scale(1); } }
  .tile.correct .g, .tile.present .g, .tile.absent .g { color: rgba(255,255,255,0.85); }
  .side { display: flex; flex-direction: column; gap: 1rem; min-width: 0; }
  .keyboard { display: flex; flex-direction: column; gap: 0.35rem; }
  .key-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.35rem; }
  .key-blank { min-height: 2.75rem; }
  button.key {
    min-width: 0; min-height: 2.75rem; border: 1px solid var(--border); border-radius: 0.4rem;
    background: var(--surface); cursor: pointer; font-family: ui-monospace, monospace; position: relative;
    padding: 0.2rem;
  }
  button.key:hover, button.key:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  button.key:active { transform: translateY(1px); }
  button.key:disabled { opacity: 0.4; cursor: default; }
  button.key .g { display: block; font-size: 0.6rem; font-family: system-ui, sans-serif; color: #64748b; }
  .actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .actions button {
    border: none; border-radius: 0.4rem; padding: 0.65rem 1rem; font-weight: 600; cursor: pointer;
    font-size: 0.95rem;
  }
  .actions button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  .enter { background: var(--accent); color: #fff; flex: 1 1 10rem; }
  .delete { background: #e8eef0; color: var(--fg); }
  .status { min-height: 2.5rem; margin-top: 1rem; font-weight: 600; }
  .status.win { color: var(--correct); }
  .status.lose { color: #b91c1c; }
  .tip {
    position: absolute; bottom: calc(100% + 0.35rem); left: 50%; transform: translateX(-50%);
    background: var(--fg); color: #fff; font-size: 0.75rem; padding: 0.25rem 0.5rem; border-radius: 0.25rem;
    white-space: nowrap; pointer-events: none; display: none; z-index: 5;
  }
  .tile:hover .tip, .tile:focus-visible .tip, button.key:hover .tip, button.key:focus-visible .tip { display: block; }
</style>
</head>
<body>
<main>
  <h1>${escapeHtml(title)}</h1>
  <p class="meta">Guess the phoneme sequence using the keyboard. Feedback is shown with colour <em>and</em> pattern.</p>
  <div class="settings" aria-label="Activity settings">
    <span>Difficulty: ${escapeHtml(difficulty)}</span>
    <span>Guesses: ${maxAttempts}</span>
    <span>${target.phonemes.length} phonemes</span>
  </div>
  <div class="layout">
    <div id="board" class="board" role="grid" aria-label="Phoneme Wordle board" aria-rowcount="${maxAttempts}"></div>
    <div class="side">
      <div id="keyboard" class="keyboard" role="group" aria-label="Phoneme keyboard"></div>
      <div class="actions">
        <button type="button" class="enter" id="enter">Enter</button>
        <button type="button" class="delete" id="delete">Delete</button>
      </div>
    </div>
  </div>
  <div class="legend" aria-hidden="true">
    <span class="swatch"><span class="dot dot-correct"></span> correct</span>
    <span class="swatch"><span class="dot dot-present"></span> wrong position</span>
    <span class="swatch"><span class="dot dot-absent"></span> not present</span>
  </div>
  <p id="status" class="status" role="status" aria-live="polite"></p>
</main>
<script>
(function () {
  const data = ${dataJson};
  const target = data.target;
  const inventory = data.inventory;
  const keyboardRows = data.keyboardRows;
  const maxAttempts = data.maxAttempts;
  const length = data.length;
  const showHints = data.showHints;
  const english = data.english;
  const guesses = Array.from({ length: maxAttempts }, () => Array(length).fill(null));
  const results = Array.from({ length: maxAttempts }, () => Array(length).fill(null));
  let row = 0;
  let col = 0;
  let locked = false;
  const board = document.getElementById("board");
  const keyboard = document.getElementById("keyboard");
  const statusEl = document.getElementById("status");
  const allowed = new Set(inventory.map((p) => p.ipa));
  const byIpa = new Map(inventory.map((p) => [p.ipa, p]));

  function hint(p) {
    return "/" + p.ipa + "/ → " + p.grapheme + " (" + p.example + ")";
  }

  function evaluate(guess) {
    const result = Array(length).fill("absent");
    const remaining = target.map((p) => p.ipa);
    for (let i = 0; i < length; i++) {
      if (guess[i] && guess[i].ipa === target[i].ipa) {
        result[i] = "correct";
        remaining[i] = "";
      }
    }
    for (let i = 0; i < length; i++) {
      if (result[i] === "correct" || !guess[i]) continue;
      const idx = remaining.indexOf(guess[i].ipa);
      if (idx >= 0) {
        result[i] = "present";
        remaining[idx] = "";
      }
    }
    return result;
  }

  function appendPhonemeContent(container, phoneme, includeHint) {
    const ipa = document.createElement("span");
    ipa.textContent = "/" + phoneme.ipa + "/";
    container.appendChild(ipa);
    if (!includeHint) return;
    const grapheme = document.createElement("span");
    grapheme.className = "g";
    grapheme.textContent = phoneme.grapheme;
    container.appendChild(grapheme);
    const tip = document.createElement("span");
    tip.className = "tip";
    tip.textContent = phoneme.grapheme + " (" + phoneme.example + ")";
    container.appendChild(tip);
  }

  function render() {
    board.innerHTML = "";
    for (let r = 0; r < maxAttempts; r++) {
      const rowEl = document.createElement("div");
      rowEl.className = "row";
      rowEl.setAttribute("role", "row");
      rowEl.setAttribute("aria-rowindex", String(r + 1));
      for (let c = 0; c < length; c++) {
        const tile = document.createElement("div");
        tile.className = "tile";
        tile.setAttribute("role", "gridcell");
        tile.setAttribute("aria-colindex", String(c + 1));
        const phoneme = guesses[r][c];
        const status = results[r][c];
        if (status) tile.classList.add(status);
        if (r === row && c === col) tile.classList.add("pending");
        if (phoneme) {
          if (showHints) {
            tile.title = hint(phoneme);
          }
          appendPhonemeContent(tile, phoneme, showHints);
          const label = "/" + phoneme.ipa + "/" + (status ? " — " + statusLabel(status) : "");
          tile.setAttribute("aria-label", label);
        } else {
          tile.setAttribute("aria-label", "Empty phoneme slot");
        }
        rowEl.appendChild(tile);
      }
      board.appendChild(rowEl);
    }
  }

  function statusLabel(status) {
    if (status === "correct") return "correct position";
    if (status === "present") return "present but wrong position";
    return "not in the word";
  }

  keyboardRows.forEach((rowSlots, rowIndex) => {
    const rowEl = document.createElement("div");
    rowEl.className = "key-row";
    rowSlots.forEach((slot, slotIndex) => {
      if (!slot || !allowed.has(slot.ipa)) {
        const blank = document.createElement("span");
        blank.className = "key-blank";
        blank.setAttribute("aria-hidden", "true");
        rowEl.appendChild(blank);
        return;
      }
      const p = byIpa.get(slot.ipa) || slot;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "key";
      if (showHints) {
        btn.title = hint(p);
        btn.setAttribute("aria-label", hint(p));
      } else {
        btn.setAttribute("aria-label", "/" + p.ipa + "/");
      }
      appendPhonemeContent(btn, p, showHints);
      btn.addEventListener("click", () => {
        if (locked || col >= length) return;
        guesses[row][col] = p;
        col += 1;
        render();
      });
      rowEl.appendChild(btn);
    });
    keyboard.appendChild(rowEl);
  });

  const drawn = new Set(
    keyboardRows.flat().filter(Boolean).map((slot) => slot.ipa),
  );
  const extras = inventory.filter((p) => !drawn.has(p.ipa));
  if (extras.length > 0) {
    const rowEl = document.createElement("div");
    rowEl.className = "key-row";
    extras.forEach((p) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "key";
      if (showHints) {
        btn.title = hint(p);
        btn.setAttribute("aria-label", hint(p));
      } else {
        btn.setAttribute("aria-label", "/" + p.ipa + "/");
      }
      appendPhonemeContent(btn, p, showHints);
      btn.addEventListener("click", () => {
        if (locked || col >= length) return;
        guesses[row][col] = p;
        col += 1;
        render();
      });
      rowEl.appendChild(btn);
    });
    keyboard.appendChild(rowEl);
  }

  document.getElementById("delete").addEventListener("click", () => {
    if (locked || col === 0) return;
    col -= 1;
    guesses[row][col] = null;
    render();
  });

  document.getElementById("enter").addEventListener("click", submit);

  function submit() {
    if (locked) return;
    if (col < length) {
      statusEl.className = "status";
      statusEl.textContent = "Fill every phoneme slot before submitting.";
      return;
    }
    const guess = guesses[row];
    const result = evaluate(guess);
    results[row] = result;
    render();
    if (result.every((s) => s === "correct")) {
      locked = true;
      statusEl.className = "status win";
      statusEl.textContent = "Correct — " + target.map((p) => "/" + p.ipa + "/").join(" ") + " = " + english;
      return;
    }
    if (row === maxAttempts - 1) {
      locked = true;
      statusEl.className = "status lose";
      statusEl.textContent = "Out of attempts. Answer: " + target.map((p) => "/" + p.ipa + "/").join(" ") + " (" + english + ")";
      return;
    }
    row += 1;
    col = 0;
    statusEl.className = "status";
    statusEl.textContent = "";
  }

  function isEditable(target) {
    if (!target || !target.tagName) return false;
    if (target.isContentEditable) return true;
    const tag = target.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
  }

  document.addEventListener("keydown", (event) => {
    if (isEditable(event.target)) return;
    if (event.key === "Enter") {
      event.preventDefault();
      submit();
    } else if (event.key === "Backspace") {
      event.preventDefault();
      document.getElementById("delete").click();
    }
  });

  render();
})();
</script>
</body>
</html>`;
}
