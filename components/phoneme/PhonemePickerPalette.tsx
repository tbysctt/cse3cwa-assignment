"use client";

import { useMemo, useState } from "react";
import type { Phoneme } from "@/lib/phoneme-types";
import { formatIpa, hintLabel } from "@/lib/phoneme-types";
import {
  paletteConsonants,
  paletteVowels,
} from "@/lib/custom-phonemes";

export function PhonemePickerPalette({
  inventory,
  onSelectPhoneme,
  title = "Phoneme keyboard palette",
  description = "Click any phoneme symbol to append it to your active custom word.",
}: {
  inventory: Phoneme[];
  onSelectPhoneme: (phoneme: Phoneme) => void;
  title?: string;
  description?: string;
}) {
  const [activeTab, setActiveTab] = useState<"consonants" | "vowels">(
    "consonants",
  );

  const consonants = useMemo(
    () => paletteConsonants(inventory),
    [inventory],
  );
  const vowels = useMemo(() => paletteVowels(inventory), [inventory]);
  const list = activeTab === "consonants" ? consonants : vowels;

  return (
    <div className="rounded-(--control-radius) border border-border bg-background p-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
            {title}
          </h4>
          <p className="text-xs text-absent">{description}</p>
        </div>
        <div className="flex gap-1 self-start sm:self-auto">
          <button
            type="button"
            className={[
              "ui-button px-2.5 py-1 text-xs",
              activeTab === "consonants"
                ? "ui-button-primary"
                : "ui-button-secondary",
            ].join(" ")}
            onClick={() => setActiveTab("consonants")}
          >
            Consonants ({consonants.length})
          </button>
          <button
            type="button"
            className={[
              "ui-button px-2.5 py-1 text-xs",
              activeTab === "vowels"
                ? "ui-button-primary"
                : "ui-button-secondary",
            ].join(" ")}
            onClick={() => setActiveTab("vowels")}
          >
            Vowels ({vowels.length})
          </button>
        </div>
      </div>

      <div
        className="mt-3 grid grid-cols-4 gap-1.5 sm:grid-cols-6 md:grid-cols-8"
        role="group"
        aria-label={`Available ${activeTab}`}
      >
        {list.map((phoneme) => {
          const label = hintLabel(phoneme);
          return (
            <button
              key={phoneme.ipa}
              type="button"
              className="flex min-h-11 flex-col items-center justify-center rounded-(--control-radius) border border-border bg-surface p-1 font-mono text-sm transition-colors hover:border-accent hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-accent"
              title={label}
              aria-label={label}
              onClick={() => onSelectPhoneme(phoneme)}
            >
              <span className="font-bold text-foreground">
                {formatIpa(phoneme.ipa)}
              </span>
              <span className="text-[0.625rem] font-sans font-medium uppercase text-absent">
                {phoneme.grapheme}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
