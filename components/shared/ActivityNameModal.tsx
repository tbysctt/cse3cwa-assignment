"use client";

import { useId, useRef, useState } from "react";

const inputClass =
  "ui-control w-full px-3 py-2 text-sm focus:border-accent focus:outline-none";

export type ActivityNameModalProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  initialName?: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (name: string) => void;
};

function ActivityNameModalForm({
  title,
  description,
  confirmLabel = "Save",
  initialName = "",
  busy = false,
  onCancel,
  onConfirm,
}: Omit<ActivityNameModalProps, "open">) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initialName);
  const trimmed = name.trim();
  const canConfirm = trimmed.length > 0 && !busy;

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
        className="ui-surface w-full max-w-md p-5 shadow-lg"
      >
        <h2 id={titleId} className="text-lg font-semibold text-foreground">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-absent">{description}</p>
        ) : null}
        <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-absent">
          Activity name
          <input
            ref={(node) => {
              inputRef.current = node;
              if (node) {
                requestAnimationFrame(() => node.focus());
              }
            }}
            className={`${inputClass} mt-1.5`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Thin — medium Wordle"
            disabled={busy}
            onKeyDown={(event) => {
              if (event.key === "Enter" && canConfirm) {
                event.preventDefault();
                onConfirm(trimmed);
              }
              if (event.key === "Escape" && !busy) onCancel();
            }}
          />
        </label>
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
            onClick={() => onConfirm(trimmed)}
            disabled={!canConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ActivityNameModal({
  open,
  initialName = "",
  ...rest
}: ActivityNameModalProps) {
  if (!open) return null;
  return (
    <ActivityNameModalForm
      key={`${rest.title}:${initialName}`}
      initialName={initialName}
      {...rest}
    />
  );
}
