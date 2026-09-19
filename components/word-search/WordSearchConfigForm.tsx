"use client";

import { useState } from "react";
import { Field } from "@/components/shared/Field";
import { SectionCard } from "@/components/shared/SectionCard";
import { PhonemePickerPalette } from "@/components/phoneme/PhonemePickerPalette";
import {
  formatIpa,
  phonemeWordDisplay,
  type Phoneme,
  type PhonemeWord,
} from "@/lib/phoneme-types";
import { DIFFICULTY_OPTIONS, type Difficulty } from "@/lib/activity";
import {
  formatPhonemeSequence,
  parsePhonemeSequence,
} from "@/lib/custom-phonemes";
import { DIFFICULTY_PRESETS } from "@/lib/wordle";
import { GRID_SIZE_BY_DIFFICULTY } from "@/lib/word-search";

const inputClass =
  "ui-control w-full px-3 py-2 text-sm focus:border-accent focus:outline-none";

export type CustomWordEntry = {
  english: string;
  phonemes: Phoneme[];
};

export function WordSearchConfigForm({
  mode = "corpus",
  onModeChange,
  wordIds,
  words,
  corpus = [],
  inventory = [],
  onWordIdChange,
  customEntries = [],
  onCustomEntryChange,
  onLoadSampleWords,
  customError,
  activeSlotIndex = 0,
  onActiveSlotIndexChange,
  onAppendPhonemeToSlot,
  difficulty,
  onDifficultyChange,
  canGenerate,
  generateHint,
  onGenerate,
}: {
  mode?: "corpus" | "custom";
  onModeChange?: (mode: "corpus" | "custom") => void;
  wordIds: string[];
  words: PhonemeWord[];
  corpus?: PhonemeWord[];
  inventory?: Phoneme[];
  onWordIdChange: (index: number, nextId: string) => void;
  customEntries?: CustomWordEntry[];
  onCustomEntryChange?: (index: number, entry: CustomWordEntry) => void;
  onLoadSampleWords?: () => void;
  customError?: string | null;
  activeSlotIndex?: number;
  onActiveSlotIndexChange?: (index: number) => void;
  onAppendPhonemeToSlot?: (phoneme: Phoneme) => void;
  difficulty: Difficulty;
  onDifficultyChange: (next: Difficulty) => void;
  canGenerate: boolean;
  generateHint?: string;
  onGenerate: () => void;
}) {
  const [internalMode, setInternalMode] = useState<"corpus" | "custom">(mode);
  const activeMode = onModeChange ? mode : internalMode;

  const [slotTextInputs, setSlotTextInputs] = useState<Record<number, string>>(
    {},
  );

  const preset = DIFFICULTY_PRESETS[difficulty];
  const gridSize = GRID_SIZE_BY_DIFFICULTY[difficulty];

  function handleModeSwitch(nextMode: "corpus" | "custom") {
    if (onModeChange) onModeChange(nextMode);
    else setInternalMode(nextMode);
  }

  function handleSlotPhonemeInput(index: number, text: string) {
    setSlotTextInputs((prev) => ({ ...prev, [index]: text }));
    if (!onCustomEntryChange) return;
    const currentEntry = customEntries[index] ?? { english: "", phonemes: [] };
    try {
      const parsed = parsePhonemeSequence(text, inventory);
      onCustomEntryChange(index, { ...currentEntry, phonemes: parsed });
    } catch {
      // Kept while typing
    }
  }

  function handleRemovePhonemeFromSlot(
    slotIndex: number,
    phonemeIndex: number,
  ) {
    if (!onCustomEntryChange) return;
    const currentEntry = customEntries[slotIndex];
    if (!currentEntry) return;
    const nextPhonemes = currentEntry.phonemes.filter(
      (_, i) => i !== phonemeIndex,
    );
    onCustomEntryChange(slotIndex, { ...currentEntry, phonemes: nextPhonemes });
    setSlotTextInputs((prev) => ({
      ...prev,
      [slotIndex]: formatPhonemeSequence(nextPhonemes),
    }));
  }

  return (
    <SectionCard
      title="Configure activity"
      description="Choose a word source (HCE corpus or custom entry) and difficulty. The live preview regenerates as you change the list."
    >
      <div className="flex flex-col gap-5">
        {/* Source Mode Toggle */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-absent">
            Word source
          </label>
          <div
            className="flex gap-2"
            role="group"
            aria-label="Word search source"
          >
            <button
              type="button"
              className={[
                "ui-button flex-1 py-1.5 text-xs font-semibold",
                activeMode === "corpus"
                  ? "ui-button-primary"
                  : "ui-button-secondary",
              ].join(" ")}
              aria-pressed={activeMode === "corpus"}
              onClick={() => handleModeSwitch("corpus")}
            >
              HCE corpus (5 words)
            </button>
            <button
              type="button"
              className={[
                "ui-button flex-1 py-1.5 text-xs font-semibold",
                activeMode === "custom"
                  ? "ui-button-primary"
                  : "ui-button-secondary",
              ].join(" ")}
              aria-pressed={activeMode === "custom"}
              onClick={() => handleModeSwitch("custom")}
            >
              Custom words (5 words)
            </button>
          </div>
        </div>

        {/* HCE Corpus Mode */}
        {activeMode === "corpus" ? (
          <fieldset>
            <legend className="text-sm font-semibold text-foreground">
              Corpus words
            </legend>
            <p className="mt-0.5 text-xs text-absent">
              Choose five words from the HCE list. Each word can only be used
              once.
            </p>
            <ol
              className="mt-3 space-y-3"
              aria-label="Word search corpus picks"
            >
              {wordIds.map((wordId, index) => {
                const selected =
                  words.find((word) => word.id === wordId) ??
                  corpus.find((word) => word.id === wordId);
                const takenElsewhere = new Set(
                  wordIds.filter((_, i) => i !== index),
                );
                return (
                  <li key={`slot-${index}`} className="space-y-1.5">
                    <label
                      className="block text-xs font-medium uppercase tracking-wide text-absent"
                      htmlFor={`word-search-slot-${index}`}
                    >
                      Word {index + 1}
                    </label>
                    <select
                      id={`word-search-slot-${index}`}
                      className={inputClass}
                      value={wordId}
                      onChange={(event) =>
                        onWordIdChange(index, event.target.value)
                      }
                    >
                      {corpus.map((entry) => (
                        <option
                          key={entry.id}
                          value={entry.id}
                          disabled={
                            takenElsewhere.has(entry.id) && entry.id !== wordId
                          }
                        >
                          {entry.english} ({entry.phonemes.length} phonemes)
                        </option>
                      ))}
                    </select>
                    {selected ? (
                      <p className="font-mono text-sm text-foreground">
                        {phonemeWordDisplay(selected)}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </fieldset>
        ) : (
          /* Custom Words Mode */
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-absent">
                Enter five custom phoneme words (max {gridSize} phonemes each
                for {gridSize}×{gridSize} grid).
              </p>
              {onLoadSampleWords ? (
                <button
                  type="button"
                  className="ui-button ui-button-secondary px-2.5 py-1 text-xs"
                  onClick={onLoadSampleWords}
                >
                  Load sample words
                </button>
              ) : null}
            </div>

            <ol className="space-y-4" aria-label="Custom word entries">
              {customEntries.map((entry, index) => {
                const isActive = activeSlotIndex === index;
                const textValue =
                  slotTextInputs[index] !== undefined
                    ? slotTextInputs[index]
                    : formatPhonemeSequence(entry.phonemes);

                return (
                  <li
                    key={`custom-slot-${index}`}
                    className={[
                      "rounded-(--control-radius) border p-3 transition-colors",
                      isActive
                        ? "border-accent bg-accent/5 ring-1 ring-accent"
                        : "border-border bg-background",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Word {index + 1}
                      </span>
                      <button
                        type="button"
                        className={[
                          "text-xs font-semibold px-2 py-0.5 rounded",
                          isActive
                            ? "bg-accent text-white"
                            : "text-accent hover:underline",
                        ].join(" ")}
                        onClick={() => onActiveSlotIndexChange?.(index)}
                      >
                        {isActive ? "Active for palette" : "Select for palette"}
                      </button>
                    </div>

                    <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor={`custom-word-english-${index}`}
                          className="block text-xs font-medium text-absent"
                        >
                          English label
                        </label>
                        <input
                          id={`custom-word-english-${index}`}
                          type="text"
                          aria-label={`Word ${index + 1} English`}
                          className={inputClass}
                          placeholder="e.g. cat"
                          value={entry.english}
                          onChange={(e) =>
                            onCustomEntryChange?.(index, {
                              ...entry,
                              english: e.target.value,
                            })
                          }
                          onFocus={() => onActiveSlotIndexChange?.(index)}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`custom-word-phonemes-${index}`}
                          className="block text-xs font-medium text-absent"
                        >
                          Phonemes (/k/ /æ/ /t/ or k æ t)
                        </label>
                        <input
                          id={`custom-word-phonemes-${index}`}
                          type="text"
                          aria-label={`Word ${index + 1} phonemes`}
                          className={inputClass}
                          placeholder="e.g. /k/ /æ/ /t/"
                          value={textValue}
                          onChange={(e) =>
                            handleSlotPhonemeInput(index, e.target.value)
                          }
                          onFocus={() => onActiveSlotIndexChange?.(index)}
                        />
                      </div>
                    </div>

                    {/* Chips for this word slot */}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {entry.phonemes.map((phoneme, pIdx) => (
                        <span
                          key={`${pIdx}-${phoneme.ipa}`}
                          className="inline-flex items-center gap-1 rounded border border-border bg-surface px-2 py-0.5 font-mono text-xs font-semibold"
                        >
                          <span>{formatIpa(phoneme.ipa)}</span>
                          <button
                            type="button"
                            aria-label={`Remove phoneme ${formatIpa(phoneme.ipa)} from Word ${index + 1}`}
                            className="text-absent hover:text-danger focus-visible:outline-none"
                            onClick={() =>
                              handleRemovePhonemeFromSlot(index, pIdx)
                            }
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      {entry.phonemes.length === 0 ? (
                        <span className="text-xs italic text-absent">
                          No phonemes yet
                        </span>
                      ) : (
                        <span className="text-xs text-absent">
                          ({entry.phonemes.length} phonemes)
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>

            {customError ? (
              <p className="rounded-(--control-radius) border border-danger/40 bg-danger/10 px-3 py-2 text-xs font-semibold text-danger">
                {customError}
              </p>
            ) : null}

            {/* Clickable Palette for Active Slot */}
            {onAppendPhonemeToSlot ? (
              <PhonemePickerPalette
                inventory={inventory}
                onSelectPhoneme={onAppendPhonemeToSlot}
                title={`Append to Word ${activeSlotIndex + 1}`}
                description={`Clicking any sound appends it to Word ${activeSlotIndex + 1}.`}
              />
            ) : null}
          </div>
        )}

        <Field
          label="Difficulty"
          hint={`Sets grid size and hints. Current: ${gridSize}×${gridSize} grid, hints ${preset.showHints ? "on" : "off"}.`}
        >
          {(id) => (
            <select
              id={id}
              className={inputClass}
              value={difficulty}
              onChange={(event) =>
                onDifficultyChange(event.target.value as Difficulty)
              }
            >
              {DIFFICULTY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </Field>

        <div className="border-t border-border pt-4">
          <button
            type="button"
            className="ui-button ui-button-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onGenerate}
            disabled={!canGenerate}
            title={generateHint}
          >
            Generate HTML
          </button>
          <p className="mt-2 text-xs text-absent">
            Downloads a self-contained, playable{" "}
            <code className="rounded bg-surface-muted px-1">
              phoneme-word-search.html
            </code>{" "}
            file that runs in any browser.
          </p>
        </div>
      </div>
    </SectionCard>
  );
}
