"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createActivityAction,
  deleteActivityAction,
  generateStoredActivityHtmlAction,
  getActivityAction,
  listActivitiesAction,
  updateActivityAction,
} from "@/app/actions/activities";
import type {
  SerializedActivity,
  SerializedActivitySummary,
} from "@/lib/activity-action-types";
import type { ActivityType, CreateActivityInput } from "@/dal/types";
import { downloadTextFile } from "@/lib/download";
import {
  canDeleteSelected,
  generateHintForMode,
  isDirtyDraft,
  resolveGenerateMode,
} from "@/lib/saved-activities";
import { ActivityNameModal } from "@/components/shared/ActivityNameModal";

function signatureWithName(draftSignature: string, name: string): string {
  try {
    const parsed = JSON.parse(draftSignature) as { name?: string };
    return JSON.stringify({ ...parsed, name: name.trim() });
  } catch {
    return draftSignature;
  }
}

export type NameDialogMode = "rename" | "save" | "saveAsNew";

export type UseSavedActivitiesOptions = {
  activityType: ActivityType;
  activityName: string;
  onActivityNameChange: (name: string) => void;
  draftSignature: string;
  /** Valid enough to generate HTML / preview. */
  canDraftGenerate: boolean;
  /** Valid enough to persist (e.g. Wordle 3/4/5 phonemes). */
  canPersist: boolean;
  buildCreateInput: (nameOverride?: string) => CreateActivityInput | null;
  applyLoadedActivity: (activity: SerializedActivity) => string;
  resetDraft: () => string;
  generateDraftHtml: () => { html: string; filename: string } | null;
  draftGenerateHint: string;
  confirmDelete?: (message: string) => boolean;
  confirmDiscard?: (message: string) => boolean;
};

export function useSavedActivities(options: UseSavedActivitiesOptions) {
  const confirmDelete = useMemo(
    () =>
      options.confirmDelete ??
      ((message: string) =>
        typeof window !== "undefined" ? window.confirm(message) : false),
    [options.confirmDelete],
  );

  const confirmDiscard = useMemo(
    () =>
      options.confirmDiscard ??
      ((message: string) =>
        typeof window !== "undefined" ? window.confirm(message) : false),
    [options.confirmDiscard],
  );

  const [savedId, setSavedId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [summaries, setSummaries] = useState<SerializedActivitySummary[]>([]);
  const [cleanSignature, setCleanSignature] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [formEpoch, setFormEpoch] = useState(0);
  const [nameDialog, setNameDialog] = useState<{
    mode: NameDialogMode;
    activityId?: string;
    initialName: string;
  } | null>(null);

  const isDirty = isDirtyDraft(
    savedId,
    cleanSignature,
    options.draftSignature,
  );

  const canSaveLoadedActivity = Boolean(
    savedId && options.canPersist && isDirty,
  );
  const canSaveAsNew = options.canPersist;
  const canFirstSave = Boolean(!savedId && options.canPersist);

  const generateMode = resolveGenerateMode({
    savedId,
    isDirty,
    canDraftGenerate: options.canDraftGenerate,
  });

  const canGenerate = generateMode !== "none";
  const generateHint = generateHintForMode(generateMode, {
    savedId,
    isDirty,
    draftHint: options.draftGenerateHint,
  });

  const refreshSummaries = useCallback(async () => {
    const result = await listActivitiesAction(options.activityType);
    if (result.ok) {
      setSummaries(result.data);
      return true;
    }
    setStatusError(result.error);
    return false;
  }, [options.activityType]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const result = await listActivitiesAction(options.activityType);
      if (cancelled) return;
      if (result.ok) {
        setSummaries(result.data);
      } else {
        setStatusError(result.error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [options.activityType]);

  const runBusy = useCallback(async (work: () => Promise<void>) => {
    setBusy(true);
    setStatusError(null);
    setStatusMessage(null);
    try {
      await work();
    } finally {
      setBusy(false);
    }
  }, []);

  const guardDirtyNavigation = useCallback(() => {
    if (!isDirty) return true;
    return confirmDiscard(
      "You have unsaved changes. Discard them and continue?",
    );
  }, [confirmDiscard, isDirty]);

  const loadActivity = useCallback(
    async (id: string) => {
      await runBusy(async () => {
        const result = await getActivityAction(id);
        if (!result.ok) {
          setStatusError(result.error);
          return;
        }
        const activity = result.data;
        let cleanSig: string;
        try {
          cleanSig = options.applyLoadedActivity(activity);
        } catch (error) {
          setStatusError(
            error instanceof Error
              ? error.message
              : "Could not apply the loaded activity.",
          );
          return;
        }
        setSavedId(activity.id);
        setSelectedId(activity.id);
        setFormEpoch((epoch) => epoch + 1);
        setCleanSignature(cleanSig);
        setStatusMessage(`Loaded “${activity.name}”.`);
      });
    },
    [options, runBusy],
  );

  const handleCreateNew = useCallback(() => {
    if (!guardDirtyNavigation()) return;
    const cleanSig = options.resetDraft();
    setSavedId(null);
    setSelectedId("");
    setCleanSignature(cleanSig);
    setFormEpoch((epoch) => epoch + 1);
    setStatusError(null);
    setStatusMessage("Started a new draft.");
  }, [guardDirtyNavigation, options]);

  const handleSelectActivity = useCallback(
    (id: string) => {
      if (id === selectedId && id === savedId && !isDirty) return;
      if (!guardDirtyNavigation()) return;
      void loadActivity(id);
    },
    [guardDirtyNavigation, isDirty, loadActivity, savedId, selectedId],
  );

  const handleRenameRequest = useCallback(
    (id: string) => {
      const summary = summaries.find((row) => row.id === id);
      setNameDialog({
        mode: "rename",
        activityId: id,
        initialName: summary?.name ?? "",
      });
    },
    [summaries],
  );

  const handleSaveRequest = useCallback(() => {
    if (savedId) {
      if (!canSaveLoadedActivity) return;
      void runBusy(async () => {
        const input = options.buildCreateInput();
        if (!input) return;
        const result = await updateActivityAction(savedId, {
          name: input.name,
          difficulty: input.difficulty,
          showHints: input.showHints,
          maxAttempts: input.maxAttempts,
          seed: input.seed,
          words: input.words,
        });
        if (!result.ok) {
          setStatusError(result.error);
          return;
        }
        setCleanSignature(options.draftSignature);
        await refreshSummaries();
        setStatusMessage(`Updated “${result.data.name}”.`);
      });
      return;
    }
    if (!canFirstSave) return;
    setNameDialog({
      mode: "save",
      initialName: options.activityName,
    });
  }, [
    canFirstSave,
    canSaveLoadedActivity,
    options,
    refreshSummaries,
    runBusy,
    savedId,
  ]);

  const handleSaveAsNewRequest = useCallback(() => {
    if (!canSaveAsNew) return;
    setNameDialog({
      mode: "saveAsNew",
      initialName: options.activityName
        ? `${options.activityName.trim()} (copy)`
        : "",
    });
  }, [canSaveAsNew, options.activityName]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!canDeleteSelected(id)) return;
      const summary = summaries.find((row) => row.id === id);
      const label = summary?.name ?? id;
      if (!confirmDelete(`Delete “${label}” permanently?`)) {
        return;
      }
      await runBusy(async () => {
        const result = await deleteActivityAction(id);
        if (!result.ok) {
          setStatusError(result.error);
          return;
        }
        if (savedId === id || selectedId === id) {
          const cleanSig = options.resetDraft();
          setSavedId(null);
          setSelectedId("");
          setCleanSignature(cleanSig);
          setFormEpoch((epoch) => epoch + 1);
        }
        await refreshSummaries();
        setStatusMessage("Deleted saved activity.");
      });
    },
    [
      confirmDelete,
      options,
      refreshSummaries,
      runBusy,
      savedId,
      selectedId,
      summaries,
    ],
  );

  const handleNameDialogConfirm = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed || !nameDialog) return;

      if (nameDialog.mode === "rename" && nameDialog.activityId) {
        const id = nameDialog.activityId;
        setNameDialog(null);
        await runBusy(async () => {
          const result = await updateActivityAction(id, { name: trimmed });
          if (!result.ok) {
            setStatusError(result.error);
            return;
          }
          if (savedId === id) {
            options.onActivityNameChange(trimmed);
            setCleanSignature(
              signatureWithName(options.draftSignature, trimmed),
            );
          }
          await refreshSummaries();
          setStatusMessage(`Renamed to “${trimmed}”.`);
        });
        return;
      }

      const mode = nameDialog.mode;
      setNameDialog(null);
      await runBusy(async () => {
        const input = options.buildCreateInput(trimmed);
        if (!input) {
          setStatusError("Configure a valid activity before saving.");
          return;
        }
        const result = await createActivityAction(input);
        if (!result.ok) {
          setStatusError(result.error);
          return;
        }
        options.onActivityNameChange(result.data.name);
        setSavedId(result.data.id);
        setSelectedId(result.data.id);
        setCleanSignature(
          signatureWithName(options.draftSignature, result.data.name),
        );
        await refreshSummaries();
        setStatusMessage(
          mode === "saveAsNew"
            ? `Saved as new “${result.data.name}”.`
            : `Saved “${result.data.name}”.`,
        );
      });
    },
    [nameDialog, options, refreshSummaries, runBusy, savedId],
  );

  const handleGenerate = useCallback(async () => {
    const mode = resolveGenerateMode({
      savedId,
      isDirty,
      canDraftGenerate: options.canDraftGenerate,
    });

    if (mode === "database" && savedId) {
      await runBusy(async () => {
        const result = await generateStoredActivityHtmlAction(savedId);
        if (!result.ok) {
          setStatusError(result.error);
          return;
        }
        downloadTextFile(result.data.filename, result.data.html);
        setStatusMessage(
          "Downloaded HTML generated from stored database data.",
        );
      });
      return;
    }

    if (mode === "draft") {
      const file = options.generateDraftHtml();
      if (!file) return;
      downloadTextFile(file.filename, file.html);
      setStatusMessage("Downloaded draft HTML.");
    }
  }, [isDirty, options, runBusy, savedId]);

  const nameDialogNode = (
    <ActivityNameModal
      open={nameDialog !== null}
      title={
        nameDialog?.mode === "rename"
          ? "Rename activity"
          : nameDialog?.mode === "saveAsNew"
            ? "Save as new activity"
            : "Name this activity"
      }
      description={
        nameDialog?.mode === "rename"
          ? "Choose a new display name for this saved configuration."
          : "Enter a name for the new saved configuration."
      }
      confirmLabel={
        nameDialog?.mode === "rename"
          ? "Rename"
          : nameDialog?.mode === "saveAsNew"
            ? "Save as new"
            : "Save"
      }
      initialName={nameDialog?.initialName ?? ""}
      busy={busy}
      onCancel={() => setNameDialog(null)}
      onConfirm={(name) => void handleNameDialogConfirm(name)}
    />
  );

  return {
    summaries,
    selectedId,
    savedId,
    isDirty,
    busy,
    message: statusMessage,
    error: statusError,
    formEpoch,
    canGenerate,
    generateHint,
    canSave: canSaveLoadedActivity || canFirstSave,
    canSaveAsNew,
    onCreateNew: handleCreateNew,
    onSelectActivity: handleSelectActivity,
    onRename: handleRenameRequest,
    onDelete: (id: string) => void handleDelete(id),
    onSave: handleSaveRequest,
    onSaveAsNew: handleSaveAsNewRequest,
    onGenerate: () => void handleGenerate(),
    nameDialogNode,
  };
}
