"use client";

import Link from "next/link";
import { useId } from "react";
import { CorpusWordManager } from "@/components/shared/CorpusWordManager";
import type { Phoneme, PhonemeWord } from "@/lib/phoneme-types";

export function WordBankModal({
  open,
  corpus,
  inventory,
  onCorpusChange,
  onClose,
}: {
  open: boolean;
  corpus: PhonemeWord[];
  inventory: Phoneme[];
  onCorpusChange: (next: PhonemeWord[], selectId?: string) => void;
  onClose: () => void;
}) {
  const titleId = useId();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="ui-surface flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden p-5 shadow-lg"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id={titleId}
              className="text-lg font-semibold text-foreground"
            >
              Word bank
            </h2>
            <p className="mt-1 text-sm text-absent">
              Add, edit, or delete phoneme words stored in the database.
            </p>
          </div>
          <button
            type="button"
            className="ui-button ui-button-secondary px-3 py-1.5 text-sm"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
          <CorpusWordManager
            corpus={corpus}
            inventory={inventory}
            onCorpusChange={onCorpusChange}
            variant="embedded"
          />
        </div>

        <p className="mt-4 border-t border-border pt-3 text-xs text-absent">
          Prefer a full page?{" "}
          <Link
            href="/word-bank"
            className="font-semibold text-accent underline-offset-2 hover:underline"
            onClick={onClose}
          >
            Open word bank
          </Link>
        </p>
      </div>
    </div>
  );
}
