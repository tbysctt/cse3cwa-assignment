"use client";

import { Field } from "@/components/shared/Field";
import { SectionCard } from "@/components/shared/SectionCard";
import {
  phonemeWordDisplay,
  PHONEME_LENGTHS,
  type PhonemeLength,
  type PhonemeWord,
} from "@/lib/phoneme-types";
import { DIFFICULTY_OPTIONS, type Difficulty } from "@/lib/activity";
import { DIFFICULTY_PRESETS } from "@/lib/wordle";

const inputClass =
  "ui-control w-full px-3 py-2 text-sm focus:border-accent focus:outline-none";

export function WordleConfigForm({
  length,
  onLengthChange,
  wordId,
  onWordIdChange,
  lengthWords,
  difficulty,
  onDifficultyChange,
  maxAttempts,
  showHints,
  canGenerate,
  generateHint,
  onGenerate,
  canSave = false,
  canSaveAsNew = false,
  saveBusy = false,
  onSave,
  onSaveAsNew,
}: {
  length: PhonemeLength;
  onLengthChange: (next: PhonemeLength) => void;
  wordId: string;
  onWordIdChange: (next: string) => void;
  lengthWords: PhonemeWord[];
  difficulty: Difficulty;
  onDifficultyChange: (next: Difficulty) => void;
  maxAttempts?: number;
  showHints?: boolean;
  canGenerate: boolean;
  generateHint?: string;
  onGenerate: () => void;
  canSave?: boolean;
  canSaveAsNew?: boolean;
  saveBusy?: boolean;
  onSave?: () => void;
  onSaveAsNew?: () => void;
}) {
  const selected =
    lengthWords.find((entry) => entry.id === wordId) ?? lengthWords[0];
  const preset = DIFFICULTY_PRESETS[difficulty];
  const effectiveMaxAttempts = maxAttempts ?? preset.maxAttempts;
  const effectiveShowHints = showHints ?? preset.showHints;

  return (
    <SectionCard
      title="Configure activity"
      description="Choose a word from the database word bank and a difficulty. The live preview updates as you go."
    >
      <div className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Phoneme length"
            hint="Show bank words with 3, 4, or 5 phonemes."
          >
            {(id) => (
              <select
                id={id}
                className={inputClass}
                value={length}
                onChange={(event) =>
                  onLengthChange(Number(event.target.value) as PhonemeLength)
                }
              >
                {PHONEME_LENGTHS.map((value) => (
                  <option key={value} value={value}>
                    {value} phonemes
                  </option>
                ))}
              </select>
            )}
          </Field>

          <Field
            label="Target word"
            hint="Select a word from the database bank."
          >
            {(id) => (
              <select
                id={id}
                className={inputClass}
                value={selected?.id ?? ""}
                onChange={(event) => onWordIdChange(event.target.value)}
                disabled={lengthWords.length === 0}
              >
                {lengthWords.length === 0 ? (
                  <option value="">No words for this length</option>
                ) : (
                  lengthWords.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.english}
                    </option>
                  ))
                )}
              </select>
            )}
          </Field>
        </div>

        {selected ? (
          <div className="rounded-(--control-radius) border border-border bg-surface-muted px-3 py-2 text-sm">
            <p className="font-semibold text-foreground">
              Target: {phonemeWordDisplay(selected)}
            </p>
            <p className="mt-1 text-xs text-absent">
              English answer (revealed on win/loss): {selected.english}
            </p>
          </div>
        ) : (
          <p className="rounded-(--control-radius) border border-danger/40 bg-danger/10 px-3 py-2 text-xs font-semibold text-danger">
            Add a {length}-phoneme word to the bank to configure this activity.
          </p>
        )}

        <Field
          label="Difficulty"
          hint={`Sets guess count and hints. Current: ${effectiveMaxAttempts} guesses, hints ${effectiveShowHints ? "on" : "off"}.`}
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
                  : "Choose a valid bank word to save"
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
                  : "Choose a valid bank word to save"
              }
            >
              Save as new
            </button>
            <button
              type="button"
              className="ui-button ui-button-primary flex-1 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              onClick={onGenerate}
              disabled={!canGenerate}
              title={
                generateHint ??
                (canGenerate
                  ? "Download the activity as a standalone HTML file"
                  : "Choose a valid bank word first")
              }
            >
              Generate and download HTML
            </button>
          </div>
          <p className="mt-2 text-xs text-absent">
            Saving requires a bank word with exactly 3, 4, or 5 phonemes.
            Generate downloads a playable{" "}
            <code className="rounded bg-surface-muted px-1">
              phoneme-wordle.html
            </code>{" "}
            file.
          </p>
        </div>
      </div>
    </SectionCard>
  );
}
