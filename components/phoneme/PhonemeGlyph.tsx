"use client";

import type { Phoneme } from "@/lib/phoneme-types";
import { formatIpa, hintLabel } from "@/lib/phoneme-types";
import { useId, useState } from "react";

type PhonemeGlyphProps = {
  phoneme: Phoneme;
  as?: "span" | "button";
  className?: string;
  showGrapheme?: boolean;
  /** When true, hover/focus tooltips explain the grapheme mapping. */
  showHint?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  "aria-label"?: string;
};

export function PhonemeGlyph({
  phoneme,
  as = "span",
  className = "",
  showGrapheme = false,
  showHint = true,
  disabled,
  onClick,
  "aria-label": ariaLabel,
}: PhonemeGlyphProps) {
  const tipId = useId();
  const [open, setOpen] = useState(false);
  const label = hintLabel(phoneme);
  const accessibleName = ariaLabel ?? (showHint ? label : formatIpa(phoneme.ipa));

  const sharedClass = [
    "relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--control-radius)] border border-border bg-surface px-2 py-1 font-mono text-base leading-none",
    className,
  ].join(" ");

  const content = (
    <>
      <span aria-hidden="true">{formatIpa(phoneme.ipa)}</span>
      {showGrapheme ? (
        <span className="mt-1 text-[0.65rem] font-sans font-semibold uppercase tracking-wide text-absent">
          {phoneme.grapheme}
        </span>
      ) : null}
      {showHint ? (
        <span id={tipId} className="sr-only">
          {label}
        </span>
      ) : null}
      {showHint && open ? (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-max max-w-48 -translate-x-1/2 rounded-(--control-radius) bg-foreground px-2 py-1 text-center font-sans text-xs font-medium text-background shadow-md"
        >
          {phoneme.grapheme} ({phoneme.example})
        </span>
      ) : null}
    </>
  );

  const tipHandlers = showHint
    ? {
      onMouseEnter: () => setOpen(true),
      onMouseLeave: () => setOpen(false),
      onFocus: () => setOpen(true),
      onBlur: () => setOpen(false),
    }
    : {};

  if (as === "button") {
    return (
      <button
        type="button"
        className={sharedClass}
        aria-label={accessibleName}
        disabled={disabled}
        onClick={onClick}
        {...(showHint ? { "aria-describedby": tipId } : {})}
        {...tipHandlers}
      >
        {content}
      </button>
    );
  }

  return (
    <span
      className={sharedClass}
      tabIndex={0}
      aria-label={accessibleName}
      {...(showHint ? { "aria-describedby": tipId } : {})}
      {...tipHandlers}
    >
      {content}
    </span>
  );
}
