"use client";

import type { SerialisedActivitySummary } from "@/lib/activity-action-types";
import { SectionCard } from "@/components/shared/SectionCard";

const iconButtonClass =
  "inline-flex size-8 items-center justify-center rounded-(--control-radius) text-absent transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40";

function PencilIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="size-4"
      fill="currentColor"
    >
      <path d="M13.586 3.586a2 2 0 0 1 2.828 2.828l-8.5 8.5A2 2 0 0 1 6.5 15.5H4v-2.5a2 2 0 0 1 .586-1.414l8.5-8.5ZM12.5 5.5l2 2" />
      <path d="M12.5 5.5 14.5 7.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="size-4"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M6 4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1h2a1 1 0 1 1 0 2h-1v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7H3a1 1 0 0 1 0-2h2V4Zm2 3a1 1 0 0 0-1 1v7a1 1 0 1 0 2 0V8a1 1 0 0 0-1-1Zm4 0a1 1 0 0 0-1 1v7a1 1 0 1 0 2 0V8a1 1 0 0 0-1-1Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function SavedActivitiesPanel({
  summaries,
  selectedId,
  savedId,
  isDirty,
  busy,
  message,
  error,
  onCreateNew,
  onSelectActivity,
  onRename,
  onDelete,
}: {
  summaries: SerialisedActivitySummary[];
  selectedId: string;
  savedId: string | null;
  isDirty: boolean;
  busy: boolean;
  message: string | null;
  error: string | null;
  onCreateNew: () => void;
  onSelectActivity: (id: string) => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <SectionCard
      title="Saved activities"
      description="Create a new draft or open a saved configuration to edit."
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-absent">
            {savedId
              ? isDirty
                ? "Editing a saved activity with unsaved changes."
                : "Showing the saved database copy."
              : "Working on an unsaved draft."}
          </p>
          <button
            type="button"
            className="ui-button ui-button-secondary px-3 py-1.5 text-sm disabled:opacity-50"
            onClick={onCreateNew}
            disabled={busy}
          >
            Create new
          </button>
        </div>

        {summaries.length === 0 ? (
          <p className="rounded-(--control-radius) border border-dashed border-border px-3 py-6 text-center text-sm text-absent">
            No saved activities yet. Configure one below, then use Save or Save
            as new.
          </p>
        ) : (
          <ul
            className="divide-y divide-border overflow-hidden rounded-(--control-radius) border border-border"
            aria-label="Saved configurations"
          >
            {summaries.map((summary) => {
              const active = selectedId === summary.id;
              return (
                <li key={summary.id} className="flex items-stretch">
                  <button
                    type="button"
                    className={[
                      "flex min-w-0 flex-1 flex-col items-start gap-0.5 px-3 py-2.5 text-left transition-colors",
                      active
                        ? "bg-accent/10 text-foreground"
                        : "bg-background hover:bg-surface-muted",
                      busy ? "cursor-not-allowed opacity-60" : "",
                    ].join(" ")}
                    onClick={() => onSelectActivity(summary.id)}
                    disabled={busy}
                    aria-current={active ? "true" : undefined}
                  >
                    <span className="w-full truncate text-sm font-semibold">
                      {summary.name}
                    </span>
                    <span className="text-xs text-absent">
                      {summary.difficulty}
                      {summary.maxAttempts != null
                        ? ` · ${summary.maxAttempts} guesses`
                        : ""}
                      {` · ${summary.wordCount} word${summary.wordCount === 1 ? "" : "s"}`}
                    </span>
                  </button>
                  <div className="flex items-center gap-0.5 border-l border-border px-1">
                    <button
                      type="button"
                      className={iconButtonClass}
                      aria-label={`Rename ${summary.name}`}
                      title="Rename"
                      disabled={busy}
                      onClick={(event) => {
                        event.stopPropagation();
                        onRename(summary.id);
                      }}
                    >
                      <PencilIcon />
                    </button>
                    <button
                      type="button"
                      className={`${iconButtonClass} hover:text-danger`}
                      aria-label={`Delete ${summary.name}`}
                      title="Delete"
                      disabled={busy}
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete(summary.id);
                      }}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {message ? (
          <p className="text-xs font-medium text-correct">{message}</p>
        ) : null}
        {error ? (
          <p className="rounded-(--control-radius) border border-danger/40 bg-danger/10 px-3 py-2 text-xs font-semibold text-danger">
            {error}
          </p>
        ) : null}
      </div>
    </SectionCard>
  );
}
