"use client";

import type { SerializedActivitySummary } from "@/lib/activity-action-types";
import { Field } from "@/components/shared/Field";
import { SectionCard } from "@/components/shared/SectionCard";

const inputClass =
  "ui-control w-full px-3 py-2 text-sm focus:border-accent focus:outline-none";

const buttonClass =
  "ui-button ui-button-secondary px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50";

export function SavedActivitiesPanel({
  activityName,
  onActivityNameChange,
  summaries,
  selectedId,
  onSelectedIdChange,
  savedId,
  isDirty,
  canSave,
  busy,
  message,
  error,
  onLoad,
  onSave,
  onSaveAsNew,
  onDelete,
}: {
  activityName: string;
  onActivityNameChange: (name: string) => void;
  summaries: SerializedActivitySummary[];
  selectedId: string;
  onSelectedIdChange: (id: string) => void;
  savedId: string | null;
  isDirty: boolean;
  canSave: boolean;
  busy: boolean;
  message: string | null;
  error: string | null;
  onLoad: () => void;
  onSave: () => void;
  onSaveAsNew: () => void;
  onDelete: () => void;
}) {
  const hasSelection = Boolean(selectedId);
  const canUpdate = Boolean(savedId) && canSave;

  return (
    <SectionCard
      title="Saved activities"
      description="Store and reload named configurations from the database."
    >
      <div className="space-y-4">
        <Field label="Activity name" hint="Required before saving.">
          {(id) => (
            <input
              id={id}
              className={inputClass}
              value={activityName}
              onChange={(event) => onActivityNameChange(event.target.value)}
              placeholder="e.g. Thin — medium Wordle"
              disabled={busy}
            />
          )}
        </Field>

        <Field
          label="Saved configurations"
          hint={
            savedId
              ? isDirty
                ? "Loaded activity has unsaved changes."
                : "Showing the saved database copy."
              : "Select a saved activity to load or delete."
          }
        >
          {(id) => (
            <select
              id={id}
              className={inputClass}
              value={selectedId}
              onChange={(event) => onSelectedIdChange(event.target.value)}
              disabled={busy || summaries.length === 0}
            >
              <option value="">
                {summaries.length === 0
                  ? "No saved activities yet"
                  : "Select a saved activity…"}
              </option>
              {summaries.map((summary) => (
                <option key={summary.id} value={summary.id}>
                  {summary.name} ({summary.difficulty}, {summary.wordCount}{" "}
                  word{summary.wordCount === 1 ? "" : "s"})
                </option>
              ))}
            </select>
          )}
        </Field>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={buttonClass}
            onClick={onLoad}
            disabled={busy || !hasSelection}
          >
            Load
          </button>
          <button
            type="button"
            className={buttonClass}
            onClick={onSave}
            disabled={busy || !canUpdate}
            title={
              savedId
                ? "Update the currently loaded activity"
                : "Load an activity first, or use Save as new"
            }
          >
            Save
          </button>
          <button
            type="button"
            className={buttonClass}
            onClick={onSaveAsNew}
            disabled={busy || !canSave}
          >
            Save as new
          </button>
          <button
            type="button"
            className={`${buttonClass} border-danger/40 text-danger`}
            onClick={onDelete}
            disabled={busy || !hasSelection}
          >
            Delete
          </button>
        </div>

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
