export function isDirtyDraft(
  savedId: string | null,
  cleanSignature: string | null,
  currentSignature: string,
): boolean {
  return (
    savedId !== null &&
    cleanSignature !== null &&
    currentSignature !== cleanSignature
  );
}

export type GenerateMode = "database" | "draft" | "none";

/**
 * Prefer DB export when a clean saved activity is loaded; otherwise allow
 * draft export whenever the draft is valid (including dirty saved drafts).
 */
export function resolveGenerateMode(options: {
  savedId: string | null;
  isDirty: boolean;
  canDraftGenerate: boolean;
}): GenerateMode {
  if (options.savedId && !options.isDirty) {
    return "database";
  }
  if (options.canDraftGenerate) {
    return "draft";
  }
  return "none";
}

export function generateHintForMode(
  mode: GenerateMode,
  options: { savedId: string | null; isDirty: boolean; draftHint: string },
): string {
  if (mode === "database") {
    return "Download HTML built from the saved database configuration";
  }
  if (options.savedId && options.isDirty && mode === "draft") {
    return "Draft has unsaved changes — downloads the current draft (save to use the database copy)";
  }
  if (mode === "draft") {
    return options.draftHint;
  }
  return options.draftHint;
}

/** Save updates the loaded activity only. */
export function canSaveLoaded(options: {
  savedId: string | null;
  canSaveDraft: boolean;
}): boolean {
  return Boolean(options.savedId && options.canSaveDraft);
}

/** Delete acts on the dropdown selection (with confirm). */
export function canDeleteSelected(selectedId: string): boolean {
  return Boolean(selectedId);
}
