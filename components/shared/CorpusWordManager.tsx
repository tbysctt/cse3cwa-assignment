"use client";

import { useMemo, useState } from "react";
import {
  createCorpusWordAction,
  deleteCorpusWordAction,
  updateCorpusWordAction,
} from "@/app/actions/corpus";
import { CorpusWordEditor } from "@/components/shared/CorpusWordEditor";
import { SectionCard } from "@/components/shared/SectionCard";
import type { Phoneme, PhonemeWord } from "@/lib/phoneme-types";
import { phonemeWordDisplay } from "@/lib/phoneme-types";

const iconButtonClass =
  "inline-flex size-8 items-center justify-center rounded-(--control-radius) text-absent transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40";

export function CorpusWordManager({
  corpus,
  inventory,
  onCorpusChange,
}: {
  corpus: PhonemeWord[];
  inventory: Phoneme[];
  onCorpusChange: (next: PhonemeWord[], selectId?: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<{
    mode: "create" | "edit";
    word?: PhonemeWord;
  } | null>(null);

  const sorted = useMemo(
    () =>
      [...corpus].sort((a, b) =>
        a.english.localeCompare(b.english, undefined, {
          sensitivity: "base",
        }),
      ),
    [corpus],
  );

  async function handleConfirm(payload: {
    english: string;
    phonemes: Phoneme[];
  }) {
    setBusy(true);
    setError(null);
    try {
      const input = {
        english: payload.english,
        phonemes: payload.phonemes.map((phoneme) => ({
          ipa: phoneme.ipa,
          grapheme: phoneme.grapheme,
          example: phoneme.example,
        })),
      };
      if (editor?.mode === "edit" && editor.word) {
        const result = await updateCorpusWordAction(editor.word.id, input);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        onCorpusChange(
          corpus.map((word) =>
            word.id === editor.word!.id ? result.data : word,
          ),
          result.data.id,
        );
      } else {
        const result = await createCorpusWordAction(input);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        onCorpusChange([...corpus, result.data], result.data.id);
      }
      setEditor(null);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(word: PhonemeWord) {
    if (
      typeof window !== "undefined" &&
      !window.confirm(`Delete “${word.english}” from the word bank permanently?`)
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await deleteCorpusWordAction(word.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onCorpusChange(corpus.filter((entry) => entry.id !== word.id));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <SectionCard
        title="Word bank"
        description="Add, edit, or delete phoneme words stored in the database. Activities pick from this list."
      >
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              type="button"
              className="ui-button ui-button-secondary px-3 py-1.5 text-sm disabled:opacity-50"
              disabled={busy}
              onClick={() => setEditor({ mode: "create" })}
            >
              Add word
            </button>
          </div>

          {sorted.length === 0 ? (
            <p className="rounded-(--control-radius) border border-dashed border-border px-3 py-6 text-center text-sm text-absent">
              No words in the bank yet. Add one to configure activities.
            </p>
          ) : (
            <ul
              className="divide-y divide-border overflow-hidden rounded-(--control-radius) border border-border"
              aria-label="Word bank"
            >
              {sorted.map((word) => (
                <li
                  key={word.id}
                  className="flex items-center gap-2 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {word.english}
                    </p>
                    <p className="truncate font-mono text-xs text-absent">
                      {phonemeWordDisplay(word)} · {word.phonemes.length}{" "}
                      phonemes
                    </p>
                  </div>
                  <button
                    type="button"
                    className={iconButtonClass}
                    aria-label={`Edit ${word.english}`}
                    title="Edit"
                    disabled={busy}
                    onClick={() => setEditor({ mode: "edit", word })}
                  >
                    <span aria-hidden="true" className="text-sm font-bold">
                      ✎
                    </span>
                  </button>
                  <button
                    type="button"
                    className={`${iconButtonClass} hover:text-danger`}
                    aria-label={`Delete ${word.english}`}
                    title="Delete"
                    disabled={busy}
                    onClick={() => void handleDelete(word)}
                  >
                    <span aria-hidden="true" className="text-sm font-bold">
                      ⌫
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {error ? (
            <p className="rounded-(--control-radius) border border-danger/40 bg-danger/10 px-3 py-2 text-xs font-semibold text-danger">
              {error}
            </p>
          ) : null}
        </div>
      </SectionCard>

      <CorpusWordEditor
        open={editor !== null}
        title={editor?.mode === "edit" ? "Edit word" : "Add word"}
        inventory={inventory}
        initialWord={editor?.word ?? null}
        busy={busy}
        error={error}
        onCancel={() => {
          if (!busy) {
            setEditor(null);
            setError(null);
          }
        }}
        onConfirm={(payload) => void handleConfirm(payload)}
      />
    </>
  );
}
