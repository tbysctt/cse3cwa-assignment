"use client";

import { useId, useMemo, useState } from "react";
import { PhonemePickerPalette } from "@/components/phoneme/PhonemePickerPalette";
import type { Phoneme, PhonemeWord } from "@/lib/phoneme-types";
import { formatIpa } from "@/lib/phoneme-types";
import {
  formatPhonemeSequence,
  parsePhonemeSequence,
  validateCustomWord,
} from "@/lib/custom-phonemes";

const inputClass =
  "ui-control w-full px-3 py-2 text-sm focus:border-accent focus:outline-none";

export type CorpusWordEditorProps = {
  open: boolean;
  title: string;
  inventory: Phoneme[];
  initialWord?: PhonemeWord | null;
  busy?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: (word: {
    english: string;
    phonemes: Phoneme[];
  }) => void;
};

function CorpusWordEditorForm({
  title,
  inventory,
  initialWord,
  busy = false,
  error = null,
  onCancel,
  onConfirm,
}: Omit<CorpusWordEditorProps, "open">) {
  const titleId = useId();
  const [english, setEnglish] = useState(initialWord?.english ?? "");
  const [phonemes, setPhonemes] = useState<Phoneme[]>(
    initialWord?.phonemes ?? [],
  );
  const [phonemeText, setPhonemeText] = useState(
    formatPhonemeSequence(initialWord?.phonemes ?? []),
  );

  const validation = useMemo(
    () =>
      validateCustomWord(english, phonemes, {
        minLength: 3,
        maxLength: 5,
      }),
    [english, phonemes],
  );

  function handlePhonemeTextInput(text: string) {
    setPhonemeText(text);
    try {
      setPhonemes(parsePhonemeSequence(text, inventory));
    } catch {
      // Keep prior phonemes while typing.
    }
  }

  function handleAddPhoneme(phoneme: Phoneme) {
    const next = [...phonemes, phoneme];
    setPhonemes(next);
    setPhonemeText(formatPhonemeSequence(next));
  }

  function handleRemovePhoneme(index: number) {
    const next = phonemes.filter((_, i) => i !== index);
    setPhonemes(next);
    setPhonemeText(formatPhonemeSequence(next));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="ui-surface max-h-[90vh] w-full max-w-lg overflow-y-auto p-5 shadow-lg"
      >
        <h2 id={titleId} className="text-lg font-semibold text-foreground">
          {title}
        </h2>
        <p className="mt-1 text-sm text-absent">
          Words in the bank must have exactly 3, 4, or 5 phonemes.
        </p>

        <div className="mt-4 space-y-4">
          <label className="block text-xs font-semibold uppercase tracking-wide text-absent">
            English label
            <input
              className={`${inputClass} mt-1.5`}
              value={english}
              onChange={(event) => setEnglish(event.target.value)}
              placeholder="e.g. ship"
              disabled={busy}
            />
          </label>

          <label className="block text-xs font-semibold uppercase tracking-wide text-absent">
            Phoneme sequence
            <input
              className={`${inputClass} mt-1.5`}
              value={phonemeText}
              onChange={(event) => handlePhonemeTextInput(event.target.value)}
              placeholder="e.g. /ʃ/ /ɪ/ /p/"
              disabled={busy}
            />
          </label>

          <div className="rounded-(--control-radius) border border-border bg-surface-muted p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-absent">
                Phonemes ({phonemes.length})
              </span>
              {phonemes.length > 0 ? (
                <button
                  type="button"
                  className="text-xs text-danger hover:underline"
                  disabled={busy}
                  onClick={() => {
                    setPhonemes([]);
                    setPhonemeText("");
                  }}
                >
                  Clear all
                </button>
              ) : null}
            </div>
            {phonemes.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {phonemes.map((phoneme, index) => (
                  <span
                    key={`${index}-${phoneme.ipa}`}
                    className="inline-flex items-center gap-1.5 rounded-(--control-radius) border border-border bg-surface px-2.5 py-1 font-mono text-sm font-semibold"
                  >
                    <span>{formatIpa(phoneme.ipa)}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${formatIpa(phoneme.ipa)}`}
                      className="text-absent hover:text-danger"
                      disabled={busy}
                      onClick={() => handleRemovePhoneme(index)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs italic text-absent">
                No phonemes yet.
              </p>
            )}
          </div>

          {!validation.valid && validation.error ? (
            <p className="rounded-(--control-radius) border border-danger/40 bg-danger/10 px-3 py-2 text-xs font-semibold text-danger">
              {validation.error}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-(--control-radius) border border-danger/40 bg-danger/10 px-3 py-2 text-xs font-semibold text-danger">
              {error}
            </p>
          ) : null}

          <PhonemePickerPalette
            inventory={inventory}
            onSelectPhoneme={handleAddPhoneme}
            title="Append phonemes"
            description="Click a symbol to add it to this word."
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="ui-button ui-button-secondary px-3 py-2 text-sm disabled:opacity-50"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="ui-button ui-button-primary px-3 py-2 text-sm disabled:opacity-50"
            disabled={busy || !validation.valid}
            onClick={() => {
              if (!validation.valid || !validation.word) return;
              onConfirm({
                english: validation.word.english,
                phonemes: validation.word.phonemes,
              });
            }}
          >
            Save word
          </button>
        </div>
      </div>
    </div>
  );
}

export function CorpusWordEditor(props: CorpusWordEditorProps) {
  if (!props.open) return null;
  return (
    <CorpusWordEditorForm
      key={props.initialWord?.id ?? "new-word"}
      {...props}
    />
  );
}
