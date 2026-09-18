"use client";

import { useEffect, useRef, useState } from "react";
import type { Phoneme, PhonemeWord } from "@/data/phonemes";
import { formatIpa } from "@/data/phonemes";
import {
  INVALID_SELECTION_FLASH_MS,
  cellsAlongSegment,
  cellKey,
  matchSelection,
  type WordSearchPuzzle,
} from "@/lib/word-search";

export function WordSearchGame({
  puzzle,
  words,
  showHints,
}: {
  puzzle: WordSearchPuzzle;
  words: PhonemeWord[];
  showHints: boolean;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [invalidKeys, setInvalidKeys] = useState<string[]>([]);
  const [foundIds, setFoundIds] = useState<Set<string>>(new Set());
  const [foundCells, setFoundCells] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const selectedRef = useRef<string[]>([]);
  const foundIdsRef = useRef<Set<string>>(new Set());
  const pointerIntentRef = useRef(false);
  const draggingRef = useRef(false);
  const anchorRef = useRef<string | null>(null);
  const invalidTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const invalidGenerationRef = useRef(0);

  function setSelectedKeys(keys: string[]) {
    selectedRef.current = keys;
    setSelected(keys);
  }

  function clearInvalidTimer() {
    if (invalidTimerRef.current !== null) {
      clearTimeout(invalidTimerRef.current);
      invalidTimerRef.current = null;
    }
  }

  function clearInvalidFeedback() {
    clearInvalidTimer();
    invalidGenerationRef.current += 1;
    setInvalidKeys([]);
  }

  function flashInvalidSelection(keys: string[]) {
    clearInvalidTimer();
    const snapshot = [...keys];
    const generation = invalidGenerationRef.current + 1;
    invalidGenerationRef.current = generation;
    setInvalidKeys(snapshot);
    setSelectedKeys(snapshot);
    invalidTimerRef.current = setTimeout(() => {
      if (invalidGenerationRef.current !== generation) return;
      setSelectedKeys([]);
      setInvalidKeys([]);
      invalidTimerRef.current = null;
    }, INVALID_SELECTION_FLASH_MS);
  }

  function tryMatch(keys: string[]): boolean {
    const match = matchSelection(
      keys,
      puzzle.placements.filter((p) => !foundIdsRef.current.has(p.word.id)),
    );
    if (!match) return false;
    clearInvalidFeedback();
    const nextFound = new Set(foundIdsRef.current).add(match.word.id);
    foundIdsRef.current = nextFound;
    setFoundIds(nextFound);
    setFoundCells((prev) => {
      const next = new Set(prev);
      for (const key of keys) next.add(key);
      return next;
    });
    setSelectedKeys([]);
    setMessage(
      nextFound.size === words.length
        ? "Well done — all phoneme words found!"
        : `Found “${match.word.english}”!`,
    );
    return true;
  }

  /** Commit a completed straight line of two or more cells. */
  function commitSelection(keys: string[]) {
    if (keys.length < 2) return;
    if (tryMatch(keys)) return;
    flashInvalidSelection(keys);
  }

  function selectSegmentTo(targetKey: string) {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const segment = cellsAlongSegment(anchor, targetKey);
    if (!segment) return;
    clearInvalidFeedback();
    setSelectedKeys(segment);
  }

  /** Keyboard workflow: first activation sets the start, the second the endpoint. */
  function activateWithKeyboard(key: string) {
    clearInvalidFeedback();
    const anchor = anchorRef.current;

    if (!anchor || selectedRef.current.length === 0) {
      anchorRef.current = key;
      setSelectedKeys([key]);
      return;
    }

    if (anchor === key) {
      anchorRef.current = null;
      setSelectedKeys([]);
      return;
    }

    const segment = cellsAlongSegment(anchor, key);
    anchorRef.current = null;
    if (!segment) {
      flashInvalidSelection([...selectedRef.current, key]);
      return;
    }

    setSelectedKeys(segment);
    commitSelection(segment);
  }

  useEffect(() => {
    function finishPointerSelection() {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      const keys = selectedRef.current;
      anchorRef.current = null;

      // A press without dragging across a second cell selects nothing.
      if (keys.length < 2) {
        clearInvalidFeedback();
        setSelectedKeys([]);
        return;
      }

      commitSelection(keys);
    }
    document.addEventListener("pointerup", finishPointerSelection);
    document.addEventListener("pointercancel", finishPointerSelection);
    return () => {
      document.removeEventListener("pointerup", finishPointerSelection);
      document.removeEventListener("pointercancel", finishPointerSelection);
    };
    // Gesture refs keep this listener stable across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle, words]);

  useEffect(() => {
    return () => {
      clearInvalidTimer();
    };
  }, []);

  function reset() {
    clearInvalidFeedback();
    anchorRef.current = null;
    setSelectedKeys([]);
    foundIdsRef.current = new Set();
    setFoundIds(new Set());
    setFoundCells(new Set());
    setMessage("");
  }

  function clearSelection() {
    clearInvalidFeedback();
    anchorRef.current = null;
    setSelectedKeys([]);
    setMessage("");
  }

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        <div className="min-w-0">
          <ul
            className="mb-3 space-y-1 text-xs text-absent"
            aria-label="How to select phonemes"
          >
            <li>
              <strong className="font-semibold text-foreground">
                Mouse or touch:
              </strong>{" "}
              drag across a straight horizontal, vertical, or diagonal line of
              phonemes.
            </li>
            <li>
              <strong className="font-semibold text-foreground">
                Keyboard:
              </strong>{" "}
              Tab to a cell, press Enter or Space to set the start, move to the
              end cell, then press Enter or Space again.
            </li>
          </ul>
          <div className="overflow-x-auto pb-1">
            <div
              className="grid gap-1.5"
              style={{
                gridTemplateColumns: `repeat(${puzzle.size}, minmax(2rem, 1fr))`,
                minWidth: `${puzzle.size * 2.5}rem`,
              }}
            >
              {puzzle.grid.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  const key = cellKey(rowIndex, colIndex);
                  const isSelected = selected.includes(key);
                  const isInvalid = invalidKeys.includes(key);
                  const isFound = foundCells.has(key);
                  const phoneme: Phoneme | null = cell;
                  const hint = phoneme
                    ? `${formatIpa(phoneme.ipa)} → ${phoneme.grapheme} (${phoneme.example})`
                    : "";
                  return (
                    <button
                      key={key}
                      type="button"
                      data-key={key}
                      data-invalid={isInvalid ? "true" : undefined}
                      className={[
                        "relative flex min-h-12 flex-col items-center justify-center rounded-(--control-radius) border font-mono text-sm transition-colors",
                        isFound
                          ? "border-correct bg-correct/20"
                          : isInvalid
                            ? "border-danger bg-danger/25 shadow-[inset_0_0_0_2px_var(--danger)] animate-pulse"
                            : isSelected
                              ? "border-accent bg-accent/20 shadow-[inset_0_0_0_2px_var(--accent)]"
                              : "border-border bg-background hover:bg-surface-muted",
                        "touch-none",
                      ].join(" ")}
                      aria-pressed={isSelected || isInvalid}
                      aria-label={[
                        showHints && hint
                          ? hint
                          : phoneme
                            ? formatIpa(phoneme.ipa)
                            : "",
                        isFound ? "found" : "",
                        isInvalid ? "not a match" : "",
                      ]
                        .filter(Boolean)
                        .join(", ")}
                      title={showHints && hint ? hint : undefined}
                      onPointerDown={(event) => {
                        if (event.button !== 0) return;
                        event.preventDefault();
                        clearInvalidFeedback();
                        pointerIntentRef.current = true;
                        draggingRef.current = true;
                        anchorRef.current = key;
                        setSelectedKeys([key]);
                      }}
                      onPointerEnter={() => {
                        if (!draggingRef.current) return;
                        selectSegmentTo(key);
                      }}
                      onClick={(event) => {
                        // Mouse and touch selection is drag-only; only keyboard
                        // activation (detail 0) drives the click workflow.
                        if (pointerIntentRef.current) {
                          pointerIntentRef.current = false;
                          return;
                        }
                        if (event.detail !== 0) return;
                        activateWithKeyboard(key);
                      }}
                    >
                      <span aria-hidden="true">
                        {phoneme ? formatIpa(phoneme.ipa) : ""}
                      </span>
                      {showHints ? (
                        <span className="text-[0.65rem] font-sans font-semibold uppercase tracking-wide text-absent">
                          {phoneme?.grapheme}
                        </span>
                      ) : null}
                      {isFound ? (
                        <span
                          aria-hidden="true"
                          className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-correct text-[0.6rem] font-bold text-white"
                        >
                          ✓
                        </span>
                      ) : null}
                    </button>
                  );
                }),
              )}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="ui-button ui-button-secondary px-4 py-2"
              onClick={clearSelection}
            >
              Clear selection
            </button>
            <button
              type="button"
              className="ui-button ui-button-secondary px-4 py-2"
              onClick={reset}
            >
              Reset activity
            </button>
          </div>
        </div>

        <aside>
          <h3 className="text-base font-semibold text-foreground">
            Find these words
          </h3>
          <ul className="mt-3 space-y-2" aria-label="Find these words">
            {words.map((word) => {
              const done = foundIds.has(word.id);
              return (
                <li
                  key={word.id}
                  className={[
                    "rounded-(--surface-radius) border border-border p-3",
                    done ? "border-correct/50 bg-correct/10" : "bg-background",
                  ].join(" ")}
                >
                  <div className="flex flex-wrap gap-1">
                    {word.phonemes.map((phoneme, index) => (
                      <span
                        key={`${index}-${phoneme.ipa}`}
                        className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-(--control-radius) border border-border bg-surface px-1.5 font-mono text-sm"
                      >
                        {formatIpa(phoneme.ipa)}
                      </span>
                    ))}
                  </div>
                  {done ? (
                    <p className="mt-2 text-sm font-semibold text-correct">
                      English: {word.english}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-absent">
                      {word.phonemes.length} phonemes
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </aside>
      </div>

      <p
        role="status"
        aria-live="polite"
        className="mt-4 min-h-6 text-sm font-semibold text-foreground"
      >
        {message}
      </p>
    </div>
  );
}
