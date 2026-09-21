import type { PhonemeWord } from "@/lib/phoneme-types";
import type { Difficulty } from "@/lib/activity";
import { escapeHtml, toJson } from "@/lib/html";
import {
  cellsForPlacement,
  DEFAULT_WORD_SEARCH_SEED,
  generateWordSearch,
  GRID_SIZE_BY_DIFFICULTY,
  INVALID_SELECTION_FLASH_MS,
  validateWordSearchPuzzle,
  type WordSearchPuzzle,
} from "@/lib/word-search";

export type WordSearchActivitySettings = {
  words: PhonemeWord[];
  difficulty: Difficulty;
  showHints: boolean;
  puzzle?: WordSearchPuzzle;
  seed?: number;
};

export function generateWordSearchHtml(
  options: WordSearchActivitySettings,
): string {
  const { words, difficulty, showHints } = options;
  const puzzle =
    options.puzzle ??
    generateWordSearch(
      words,
      GRID_SIZE_BY_DIFFICULTY[difficulty],
      options.seed ?? DEFAULT_WORD_SEARCH_SEED,
    );
  validateWordSearchPuzzle(puzzle, words);
  const title = "PHONEME WORD SEARCH";

  const wordsJson = toJson(
    words.map((word) => {
      const placement = puzzle.placements.find((p) => p.word.id === word.id);
      return {
        id: word.id,
        english: word.english,
        display: word.phonemes.map((p) => `/${p.ipa}/`).join(" "),
        hint: word.phonemes
          .map((p) => `/${p.ipa}/ → ${p.grapheme} (${p.example})`)
          .join("; "),
        cells: placement ? cellsForPlacement(placement) : [],
      };
    }),
  );

  const gridJson = toJson(
    puzzle.grid.map((row) =>
      row.map((cell) => ({
        ipa: cell!.ipa,
        grapheme: cell!.grapheme,
        example: cell!.example,
      })),
    ),
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>
  :root {
    --bg: #f4f7fb; --fg: #1a2332; --surface: #fff; --border: #c5d0e0;
    --accent: #1d4ed8; --correct: #15803d; --selected: #bfdbfe; --danger: #b91c1c;
  }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: "Noto Sans", system-ui, sans-serif; background: var(--bg); color: var(--fg); }
  main { max-width: 54rem; margin: 0 auto; padding: 1.5rem 1rem 3rem; }
  h1 { font-size: 1.5rem; letter-spacing: 0.04em; margin: 0 0 0.5rem; }
  .meta { color: #64748b; margin-bottom: 0.5rem; }
  .how-to {
    list-style: none; padding: 0; margin: 0 0 1rem;
    color: #64748b; font-size: 0.85rem; display: grid; gap: 0.2rem;
  }
  .how-to strong { color: var(--fg); }
  .settings {
    display: inline-flex; flex-wrap: wrap; gap: 0.4rem 0.9rem;
    margin-bottom: 1rem; font-size: 0.85rem; color: #64748b;
  }
  .settings span { background: var(--surface); border: 1px solid var(--border); border-radius: 999px; padding: 0.2rem 0.6rem; }
  .layout { display: grid; gap: 1.5rem; }
  @media (min-width: 768px) { .layout { grid-template-columns: 1fr 15rem; } }
  .grid-wrap { overflow-x: auto; padding-bottom: 0.25rem; }
  .grid {
    display: grid; gap: 0.25rem;
    grid-template-columns: repeat(${puzzle.size}, minmax(2rem, 1fr));
    min-width: ${puzzle.size * 2.4}rem;
    user-select: none;
  }
  .cell {
    min-height: 2.75rem; border: 1px solid var(--border); border-radius: 0.35rem;
    background: var(--surface); font-family: ui-monospace, monospace; font-size: 0.9rem;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    cursor: pointer; position: relative; touch-action: none;
  }
  .cell .g { font-size: 0.6rem; font-family: system-ui, sans-serif; color: #64748b; }
  .cell.selected {
    background: var(--selected); border-color: var(--accent);
    box-shadow: inset 0 0 0 2px var(--accent);
  }
  .cell.invalid {
    background: #fecaca; border-color: var(--danger);
    box-shadow: inset 0 0 0 2px var(--danger);
    animation: invalid-pulse 0.35s ease;
  }
  @keyframes invalid-pulse {
    from { transform: scale(0.97); }
    to { transform: scale(1); }
  }
  .cell.found {
    background: #bbf7d0; border-color: var(--correct); opacity: 0.9;
    box-shadow: inset 0 0 0 2px var(--correct);
  }
  .tip {
    position: absolute; bottom: calc(100% + 0.25rem); left: 50%; transform: translateX(-50%);
    background: var(--fg); color: #fff; font-size: 0.7rem; padding: 0.2rem 0.4rem; border-radius: 0.25rem;
    white-space: nowrap; display: none; pointer-events: none; z-index: 5;
  }
  .cell:hover .tip, .cell:focus-visible .tip { display: block; }
  .list { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.5rem; }
  .list li {
    border: 1px solid var(--border); border-radius: 0.4rem; padding: 0.6rem 0.75rem; background: var(--surface);
  }
  .list li.done { opacity: 0.65; }
  .list .eng { display: none; color: var(--correct); font-weight: 600; font-size: 0.85rem; }
  .list li.done .eng { display: block; }
  .status { margin-top: 1rem; font-weight: 600; min-height: 1.4rem; }
  .actions { margin-top: 0.75rem; display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .actions button {
    border: none; background: var(--accent); color: #fff; border-radius: 0.4rem;
    padding: 0.55rem 0.9rem; font-weight: 600; cursor: pointer;
  }
</style>
</head>
<body>
<main>
  <h1>${escapeHtml(title)}</h1>
  <p class="meta">Select a straight horizontal, vertical, or diagonal line of connected phoneme cells that matches a word in the list. Hover or focus a cell for letter hints.</p>
  <ul class="how-to">
    <li><strong>Mouse or touch:</strong> drag across a straight horizontal, vertical, or diagonal line of phonemes.</li>
    <li><strong>Keyboard:</strong> Tab to a cell, press Enter or Space to set the start, move to the end cell, then press Enter or Space again.</li>
  </ul>
  <div class="settings" aria-label="Activity settings">
    <span>Difficulty: ${escapeHtml(difficulty)}</span>
    <span>${words.length} words</span>
  </div>
  <div class="layout">
    <div>
      <div class="grid-wrap"><div id="grid" class="grid" aria-label="Phoneme word search grid"></div></div>
      <div class="actions">
        <button type="button" id="clear">Clear selection</button>
        <button type="button" id="reset">Reset activity</button>
      </div>
      <p id="status" class="status" role="status" aria-live="polite"></p>
    </div>
    <div>
      <h2 style="font-size:1rem;margin:0 0 0.5rem;">Find these words</h2>
      <ul id="list" class="list"></ul>
    </div>
  </div>
</main>
<script>
(function () {
  const gridData = ${gridJson};
  const words = ${wordsJson};
  const size = ${puzzle.size};
  const showHints = ${showHints ? "true" : "false"};
  const flashMs = ${INVALID_SELECTION_FLASH_MS};
  const found = new Set();
  const foundCells = new Set();
  let selecting = false;
  let selected = [];
  let invalid = [];
  let anchor = null;
  let suppressClick = false;
  let invalidTimer = null;
  let invalidGeneration = 0;
  const gridEl = document.getElementById("grid");
  const listEl = document.getElementById("list");
  const statusEl = document.getElementById("status");

  function key(r, c) { return r + "-" + c; }

  function parseKey(value) {
    const match = /^(\\d+)-(\\d+)$/.exec(value);
    return match ? [Number(match[1]), Number(match[2])] : null;
  }

  function cellsAlongSegment(startKey, endKey) {
    const start = parseKey(startKey);
    const end = parseKey(endKey);
    if (!start || !end) return null;
    if (start[0] === end[0] && start[1] === end[1]) return [startKey];
    const rowDelta = end[0] - start[0];
    const colDelta = end[1] - start[1];
    const rowStep = rowDelta === 0 ? 0 : (rowDelta > 0 ? 1 : -1);
    const colStep = colDelta === 0 ? 0 : (colDelta > 0 ? 1 : -1);
    const rowDistance = Math.abs(rowDelta);
    const colDistance = Math.abs(colDelta);
    const axis = (rowStep === 0 && colStep !== 0) || (colStep === 0 && rowStep !== 0);
    const diagonal = rowStep !== 0 && colStep !== 0 && rowDistance === colDistance;
    if (!axis && !diagonal) return null;
    const steps = Math.max(rowDistance, colDistance);
    const keys = [];
    for (let index = 0; index <= steps; index++) {
      keys.push(key(start[0] + rowStep * index, start[1] + colStep * index));
    }
    return keys;
  }

  function isStraightContiguous(keys) {
    if (keys.length === 0 || new Set(keys).size !== keys.length) return false;
    if (keys.length === 1) return parseKey(keys[0]) !== null;
    const segment = cellsAlongSegment(keys[0], keys[keys.length - 1]);
    return !!segment && segment.length === keys.length &&
      segment.every((value, index) => value === keys[index]);
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

  function renderList() {
    listEl.innerHTML = "";
    words.forEach((w) => {
      const li = document.createElement("li");
      if (found.has(w.id)) li.classList.add("done");
      if (showHints) li.title = w.hint;
      const display = document.createElement("div");
      display.textContent = w.display;
      li.appendChild(display);
      const english = document.createElement("div");
      english.className = "eng";
      english.textContent = "English: " + w.english;
      li.appendChild(english);
      listEl.appendChild(li);
    });
  }

  function updateSelectionClasses() {
    gridEl.querySelectorAll(".cell").forEach((el) => {
      const k = el.getAttribute("data-key");
      el.classList.toggle("selected", selected.includes(k) && !invalid.includes(k));
      el.classList.toggle("invalid", invalid.includes(k));
      el.classList.toggle("found", foundCells.has(k));
      if (invalid.includes(k)) el.setAttribute("aria-invalid", "true");
      else el.removeAttribute("aria-invalid");
    });
  }

  function clearInvalidTimer() {
    if (invalidTimer !== null) {
      clearTimeout(invalidTimer);
      invalidTimer = null;
    }
  }

  function clearInvalidFeedback() {
    clearInvalidTimer();
    invalidGeneration += 1;
    invalid = [];
  }

  function flashInvalid(keys) {
    clearInvalidTimer();
    const snapshot = keys.slice();
    invalidGeneration += 1;
    const generation = invalidGeneration;
    selected = snapshot;
    invalid = snapshot;
    updateSelectionClasses();
    invalidTimer = setTimeout(() => {
      if (generation !== invalidGeneration) return;
      selected = [];
      invalid = [];
      invalidTimer = null;
      updateSelectionClasses();
    }, flashMs);
  }

  function tryMatch(keys) {
    if (!isStraightContiguous(keys)) return false;
    for (const w of words) {
      if (found.has(w.id)) continue;
      const forward = w.cells.every((c, index) => keys[index] === c);
      const reverse = w.cells.every((c, index) => keys[w.cells.length - index - 1] === c);
      if (w.cells.length === keys.length && (forward || reverse)) {
        found.add(w.id);
        w.cells.forEach((c) => foundCells.add(c));
        selected = [];
        invalid = [];
        statusEl.textContent = "Found \\u201c" + w.english + "\\u201d!";
        renderList();
        updateSelectionClasses();
        if (found.size === words.length) {
          statusEl.textContent = "Well done \\u2014 all phoneme words found!";
        }
        return true;
      }
    }
    return false;
  }

  function commitSelection(keys) {
    if (keys.length < 2) return;
    if (tryMatch(keys)) return;
    flashInvalid(keys);
  }

  function selectSegmentTo(targetKey) {
    if (!anchor) return;
    const segment = cellsAlongSegment(anchor, targetKey);
    if (!segment) return;
    clearInvalidFeedback();
    selected = segment;
    updateSelectionClasses();
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cell = gridData[r][c];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cell";
      btn.dataset.key = key(r, c);
      const hintText = "/" + cell.ipa + "/ → " + cell.grapheme + " (" + cell.example + ")";
      if (showHints) {
        btn.title = hintText;
        btn.setAttribute("aria-label", hintText);
      } else {
        btn.setAttribute("aria-label", "/" + cell.ipa + "/");
      }
      appendPhonemeContent(btn, cell, showHints);
      btn.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        clearInvalidFeedback();
        suppressClick = true;
        selecting = true;
        anchor = key(r, c);
        selected = [anchor];
        updateSelectionClasses();
      });
      btn.addEventListener("pointerenter", () => {
        if (selecting) selectSegmentTo(key(r, c));
      });
      btn.addEventListener("click", (e) => {
        // Mouse and touch selection is drag-only; only keyboard activation
        // (detail 0) drives the click workflow.
        if (suppressClick) {
          suppressClick = false;
          return;
        }
        if (selecting || e.detail !== 0) return;
        clearInvalidFeedback();
        const activated = key(r, c);
        if (!anchor || selected.length === 0) {
          anchor = activated;
          selected = [activated];
          updateSelectionClasses();
          return;
        }
        if (anchor === activated) {
          anchor = null;
          selected = [];
          updateSelectionClasses();
          return;
        }
        const segment = cellsAlongSegment(anchor, activated);
        anchor = null;
        if (!segment) {
          flashInvalid(selected.concat(activated));
          return;
        }
        selected = segment;
        updateSelectionClasses();
        commitSelection(segment);
      });
      gridEl.appendChild(btn);
    }
  }

  function finishPointerSelection() {
    if (!selecting) return;
    selecting = false;
    const keys = selected.slice();
    anchor = null;
    // A press without dragging across a second cell selects nothing.
    if (keys.length < 2) {
      clearInvalidFeedback();
      selected = [];
      updateSelectionClasses();
      return;
    }
    commitSelection(keys);
  }

  document.addEventListener("pointerup", finishPointerSelection);
  document.addEventListener("pointercancel", finishPointerSelection);
  document.getElementById("clear").addEventListener("click", () => {
    clearInvalidFeedback();
    selected = [];
    anchor = null;
    updateSelectionClasses();
    statusEl.textContent = "";
  });
  document.getElementById("reset").addEventListener("click", () => {
    clearInvalidFeedback();
    found.clear();
    foundCells.clear();
    selected = [];
    anchor = null;
    statusEl.textContent = "";
    renderList();
    updateSelectionClasses();
  });

  renderList();
})();
</script>
</body>
</html>`;
}
