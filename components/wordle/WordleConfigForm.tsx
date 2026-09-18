"use client";

import { useState } from "react";
import { Field } from "@/components/shared/Field";
import { SectionCard } from "@/components/shared/SectionCard";
import { PhonemePickerPalette } from "@/components/phoneme/PhonemePickerPalette";
import {
  formatIpa,
  phonemeWordDisplay,
  type Phoneme,
  type PhonemeLength,
  type PhonemeWord,
} from "@/data/phonemes";
import { PHONEME_LENGTHS } from "@/data/hce-corpus";
import { DIFFICULTY_OPTIONS, type Difficulty } from "@/lib/activity";
import {
  formatPhonemeSequence,
  parsePhonemeSequence,
} from "@/lib/custom-phonemes";
import { DIFFICULTY_PRESETS } from "@/lib/wordle";

const inputClass =
  "ui-control w-full px-3 py-2 text-sm focus:border-accent focus:outline-none";

const SAMPLE_CUSTOM_WORDS: { english: string; rawPhonemes: string }[] = [
  { english: "cat", rawPhonemes: "/k/ /æ/ /t/" },
  { english: "dog", rawPhonemes: "/d/ /ɔ/ /ɡ/" },
  { english: "fish", rawPhonemes: "/f/ /ɪ/ /ʃ/" },
  { english: "beach", rawPhonemes: "/b/ /iː/ /tʃ/" },
  { english: "cheese", rawPhonemes: "/tʃ/ /iː/ /z/" },
];

export function WordleConfigForm({
  mode = "corpus",
  onModeChange,
  length,
  onLengthChange,
  wordId,
  onWordIdChange,
  lengthWords,
  customEnglish = "",
  onCustomEnglishChange,
  customPhonemes = [],
  onCustomPhonemesChange,
  customError,
  difficulty,
  onDifficultyChange,
  canGenerate,
  onGenerate,
}: {
  mode?: "corpus" | "custom";
  onModeChange?: (mode: "corpus" | "custom") => void;
  length: PhonemeLength;
  onLengthChange: (next: PhonemeLength) => void;
  wordId: string;
  onWordIdChange: (next: string) => void;
  lengthWords: PhonemeWord[];
  customEnglish?: string;
  onCustomEnglishChange?: (value: string) => void;
  customPhonemes?: Phoneme[];
  onCustomPhonemesChange?: (phonemes: Phoneme[]) => void;
  customError?: string | null;
  difficulty: Difficulty;
  onDifficultyChange: (next: Difficulty) => void;
  canGenerate: boolean;
  onGenerate: () => void;
}) {
  const [internalMode, setInternalMode] = useState<"corpus" | "custom">(mode);
  const activeMode = onModeChange ? mode : internalMode;

  const [phonemeText, setPhonemeText] = useState(() =>
    formatPhonemeSequence(customPhonemes),
  );

  const selected =
    lengthWords.find((entry) => entry.id === wordId) ?? lengthWords[0];
  const preset = DIFFICULTY_PRESETS[difficulty];

  function handleModeSwitch(nextMode: "corpus" | "custom") {
    if (onModeChange) onModeChange(nextMode);
    else setInternalMode(nextMode);
  }

  function handlePhonemeTextInput(text: string) {
    setPhonemeText(text);
    if (onCustomPhonemesChange) {
      try {
        const parsed = parsePhonemeSequence(text);
        onCustomPhonemesChange(parsed);
      } catch {
        // Kept as-is while typing
      }
    }
  }

  function handleAddPhoneme(phoneme: Phoneme) {
    if (!onCustomPhonemesChange) return;
    const nextPhonemes = [...customPhonemes, phoneme];
    onCustomPhonemesChange(nextPhonemes);
    setPhonemeText(formatPhonemeSequence(nextPhonemes));
  }

  function handleRemovePhoneme(index: number) {
    if (!onCustomPhonemesChange) return;
    const nextPhonemes = customPhonemes.filter((_, i) => i !== index);
    onCustomPhonemesChange(nextPhonemes);
    setPhonemeText(formatPhonemeSequence(nextPhonemes));
  }

  function handleLoadPreset(presetItem: {
    english: string;
    rawPhonemes: string;
  }) {
    if (onCustomEnglishChange) onCustomEnglishChange(presetItem.english);
    if (onCustomPhonemesChange) {
      const parsed = parsePhonemeSequence(presetItem.rawPhonemes);
      onCustomPhonemesChange(parsed);
      setPhonemeText(formatPhonemeSequence(parsed));
    }
  }

  return (
    <SectionCard
      title="Configure activity"
      description="Choose a word source (HCE corpus or custom entry) and difficulty. The live preview updates as you go."
    >
      <div className="flex flex-col gap-5">
        {/* Source Mode Toggle */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-absent">
            Word source
          </label>
          <div className="flex gap-2" role="group" aria-label="Word source">
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
              HCE corpus
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
              Custom word entry
            </button>
          </div>
        </div>

        {/* HCE Corpus Mode */}
        {activeMode === "corpus" ? (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Phoneme length"
                hint="Each corpus word has 3, 4, or 5 phonemes. Students guess that many cells."
              >
                {(id) => (
                  <select
                    id={id}
                    className={inputClass}
                    value={length}
                    onChange={(event) =>
                      onLengthChange(
                        Number(event.target.value) as PhonemeLength,
                      )
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
                label="Corpus word"
                hint="Select one of the 30 approved HCE words for this length."
              >
                {(id) => (
                  <select
                    id={id}
                    className={inputClass}
                    value={selected?.id ?? ""}
                    onChange={(event) => onWordIdChange(event.target.value)}
                  >
                    {lengthWords.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.english}
                      </option>
                    ))}
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
            ) : null}
          </>
        ) : (
          /* Custom Word Mode */
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-absent">
                Quick sample words:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_CUSTOM_WORDS.map((item) => (
                  <button
                    key={item.english}
                    type="button"
                    className="ui-button ui-button-secondary px-2 py-0.5 text-xs"
                    onClick={() => handleLoadPreset(item)}
                  >
                    {item.english}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="English answer"
                hint="Shown to students on win or loss (e.g. cat, fish)."
              >
                {(id) => (
                  <input
                    id={id}
                    type="text"
                    className={inputClass}
                    placeholder="e.g. cat"
                    value={customEnglish}
                    onChange={(e) => onCustomEnglishChange?.(e.target.value)}
                  />
                )}
              </Field>

              <Field
                label="Phoneme sequence text"
                hint="Type IPA with slashes, spaces, or click symbols below."
              >
                {(id) => (
                  <input
                    id={id}
                    type="text"
                    className={inputClass}
                    placeholder="e.g. /k/ /æ/ /t/ or k æ t"
                    value={phonemeText}
                    onChange={(e) => handlePhonemeTextInput(e.target.value)}
                  />
                )}
              </Field>
            </div>

            {/* Custom Phonemes Chip Sequence */}
            <div className="rounded-(--control-radius) border border-border bg-surface-muted p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-absent">
                  Target Phonemes ({customPhonemes.length})
                </span>
                {customPhonemes.length > 0 ? (
                  <button
                    type="button"
                    className="text-xs text-danger hover:underline"
                    onClick={() => {
                      onCustomPhonemesChange?.([]);
                      setPhonemeText("");
                    }}
                  >
                    Clear all
                  </button>
                ) : null}
              </div>

              {customPhonemes.length > 0 ? (
                <div
                  className="mt-2 flex flex-wrap gap-1.5"
                  aria-label="Selected custom phonemes"
                >
                  {customPhonemes.map((phoneme, index) => (
                    <span
                      key={`${index}-${phoneme.ipa}`}
                      className="inline-flex items-center gap-1.5 rounded-(--control-radius) border border-border bg-surface px-2.5 py-1 font-mono text-sm font-semibold text-foreground shadow-xs"
                    >
                      <span>{formatIpa(phoneme.ipa)}</span>
                      <span className="text-[0.65rem] font-sans font-normal text-absent">
                        {phoneme.grapheme}
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove phoneme ${formatIpa(phoneme.ipa)} at position ${index + 1}`}
                        className="ml-1 text-absent hover:text-danger focus-visible:outline-none"
                        onClick={() => handleRemovePhoneme(index)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs italic text-absent">
                  No phonemes entered yet. Type above or click a phoneme in the
                  palette below.
                </p>
              )}

              {customEnglish && customPhonemes.length > 0 ? (
                <p className="mt-2 text-xs text-foreground">
                  <strong>Preview:</strong>{" "}
                  {customPhonemes.map((p) => formatIpa(p.ipa)).join(" ")} =
                  &ldquo;{customEnglish}&rdquo;
                </p>
              ) : null}
            </div>

            {customError ? (
              <p className="rounded-(--control-radius) border border-danger/40 bg-danger/10 px-3 py-2 text-xs font-semibold text-danger">
                {customError}
              </p>
            ) : null}

            {/* Clickable Palette */}
            <PhonemePickerPalette
              onSelectPhoneme={handleAddPhoneme}
              title="Phoneme click palette"
              description="Click any sound to append to the target word."
            />
          </div>
        )}

        <Field
          label="Difficulty"
          hint={`Sets guess count and hints. Current: ${preset.maxAttempts} guesses, hints ${preset.showHints ? "on" : "off"}.`}
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
            title={
              canGenerate
                ? "Download the activity as a standalone HTML file"
                : "Configure a valid target word first"
            }
          >
            Generate HTML
          </button>
          <p className="mt-2 text-xs text-absent">
            Downloads a self-contained, playable{" "}
            <code className="rounded bg-surface-muted px-1">
              phoneme-wordle.html
            </code>{" "}
            file that runs in any browser.
          </p>
        </div>
      </div>
    </SectionCard>
  );
}
