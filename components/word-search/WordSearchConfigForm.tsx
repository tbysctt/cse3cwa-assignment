"use client";

import { Field } from "@/components/shared/Field";
import { SectionCard } from "@/components/shared/SectionCard";
import {
  phonemeWordDisplay,
  type PhonemeWord,
} from "@/lib/phoneme-types";
import { DIFFICULTY_OPTIONS, type Difficulty } from "@/lib/activity";
import { DIFFICULTY_PRESETS } from "@/lib/wordle";
import { GRID_SIZE_BY_DIFFICULTY } from "@/lib/word-search";

const inputClass =
  "ui-control w-full px-3 py-2 text-sm focus:border-accent focus:outline-none";

export function WordSearchConfigForm({
  wordIds,
  words,
  corpus = [],
  onWordIdChange,
  difficulty,
  onDifficultyChange,
  canGenerate,
  generateHint,
  onGenerate,
  canSave = false,
  canSaveAsNew = false,
  saveBusy = false,
  onSave,
  onSaveAsNew,
}: {
  wordIds: string[];
  words: PhonemeWord[];
  corpus?: PhonemeWord[];
  onWordIdChange: (index: number, nextId: string) => void;
  difficulty: Difficulty;
  onDifficultyChange: (next: Difficulty) => void;
  canGenerate: boolean;
  generateHint?: string;
  onGenerate: () => void;
  canSave?: boolean;
  canSaveAsNew?: boolean;
  saveBusy?: boolean;
  onSave?: () => void;
  onSaveAsNew?: () => void;
}) {
  const preset = DIFFICULTY_PRESETS[difficulty];
  const gridSize = GRID_SIZE_BY_DIFFICULTY[difficulty];

  return (
    <SectionCard
      title="Configure activity"
      description="Choose five words from the database word bank and a difficulty. The live preview regenerates as you change the list."
    >
      <div className="flex flex-col gap-5">
        <fieldset>
          <legend className="text-sm font-semibold text-foreground">
            Bank words
          </legend>
          <p className="mt-0.5 text-xs text-absent">
            Choose five different words from the database. Each word can only be
            used once.
          </p>
          <ol
            className="mt-3 space-y-3"
            aria-label="Word search bank picks"
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
                    disabled={corpus.length === 0}
                  >
                    {corpus.length === 0 ? (
                      <option value="">No words in the bank</option>
                    ) : (
                      corpus.map((entry) => (
                        <option
                          key={entry.id}
                          value={entry.id}
                          disabled={
                            takenElsewhere.has(entry.id) &&
                            entry.id !== wordId
                          }
                        >
                          {entry.english} ({entry.phonemes.length} phonemes)
                        </option>
                      ))
                    )}
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
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              className="ui-button ui-button-secondary flex-1 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              onClick={onSave}
              disabled={saveBusy || !canSave || !onSave}
              title={
                canSave
                  ? "Save configuration changes to the database"
                  : "Choose five different bank words before saving"
              }
            >
              Save
            </button>
            <button
              type="button"
              className="ui-button ui-button-secondary flex-1 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              onClick={onSaveAsNew}
              disabled={saveBusy || !canSaveAsNew || !onSaveAsNew}
              title={
                canSaveAsNew
                  ? "Save a new named copy of this configuration"
                  : "Choose five different bank words before saving"
              }
            >
              Save as new
            </button>
            <button
              type="button"
              className="ui-button ui-button-primary flex-1 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              onClick={onGenerate}
              disabled={!canGenerate}
              title={generateHint}
            >
              Generate and download HTML
            </button>
          </div>
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
