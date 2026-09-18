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
  canSaveLoaded,
  generateHintForMode,
  isDirtyDraft,
  resolveGenerateMode,
} from "@/lib/saved-activities";

export type UseSavedActivitiesOptions = {
  activityType: ActivityType;
  activityName: string;
  draftSignature: string;
  canDraftGenerate: boolean;
  buildCreateInput: () => CreateActivityInput | null;
  applyLoadedActivity: (activity: SerializedActivity) => string;
  generateDraftHtml: () => { html: string; filename: string } | null;
  draftGenerateHint: string;
  confirmDelete?: (message: string) => boolean;
};

export function useSavedActivities(options: UseSavedActivitiesOptions) {
  const confirmDelete = useMemo(
    () =>
      options.confirmDelete ??
      ((message: string) =>
        typeof window !== "undefined" ? window.confirm(message) : false),
    [options.confirmDelete],
  );

  const [savedId, setSavedId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [summaries, setSummaries] = useState<SerializedActivitySummary[]>([]);
  const [cleanSignature, setCleanSignature] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [formEpoch, setFormEpoch] = useState(0);

  const isDirty = isDirtyDraft(
    savedId,
    cleanSignature,
    options.draftSignature,
  );

  const canSaveDraft = Boolean(
    options.activityName.trim() && options.canDraftGenerate,
  );

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

  const handleLoad = useCallback(async () => {
    if (!selectedId) return;
    await runBusy(async () => {
      const result = await getActivityAction(selectedId);
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
  }, [options, runBusy, selectedId]);

  const handleSaveAsNew = useCallback(async () => {
    const input = options.buildCreateInput();
    if (!input || !canSaveDraft) return;
    await runBusy(async () => {
      const result = await createActivityAction(input);
      if (!result.ok) {
        setStatusError(result.error);
        return;
      }
      setSavedId(result.data.id);
      setSelectedId(result.data.id);
      setCleanSignature(options.draftSignature);
      await refreshSummaries();
      setStatusMessage(`Saved “${result.data.name}”.`);
    });
  }, [canSaveDraft, options, refreshSummaries, runBusy]);

  const handleSave = useCallback(async () => {
    if (!canSaveLoaded({ savedId, canSaveDraft }) || !savedId) return;
    const input = options.buildCreateInput();
    if (!input) return;
    await runBusy(async () => {
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
  }, [canSaveDraft, options, refreshSummaries, runBusy, savedId]);

  const handleDelete = useCallback(async () => {
    if (!canDeleteSelected(selectedId)) return;
    const summary = summaries.find((row) => row.id === selectedId);
    const label = summary?.name ?? selectedId;
    if (!confirmDelete(`Delete “${label}” permanently?`)) {
      return;
    }
    await runBusy(async () => {
      const result = await deleteActivityAction(selectedId);
      if (!result.ok) {
        setStatusError(result.error);
        return;
      }
      if (savedId === selectedId) {
        setSavedId(null);
        setCleanSignature(null);
      }
      setSelectedId("");
      await refreshSummaries();
      setStatusMessage("Deleted saved activity.");
    });
  }, [
    confirmDelete,
    refreshSummaries,
    runBusy,
    savedId,
    selectedId,
    summaries,
  ]);

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
    }
  }, [isDirty, options, runBusy, savedId]);

  const panelProps = useMemo(
    () => ({
      summaries,
      selectedId,
      onSelectedIdChange: setSelectedId,
      savedId,
      isDirty,
      canSave: canSaveDraft,
      busy,
      message: statusMessage,
      error: statusError,
      onLoad: () => void handleLoad(),
      onSave: () => void handleSave(),
      onSaveAsNew: () => void handleSaveAsNew(),
      onDelete: () => void handleDelete(),
    }),
    [
      busy,
      canSaveDraft,
      handleDelete,
      handleLoad,
      handleSave,
      handleSaveAsNew,
      isDirty,
      savedId,
      selectedId,
      statusError,
      statusMessage,
      summaries,
    ],
  );

  return {
    ...panelProps,
    formEpoch,
    canGenerate,
    generateHint,
    onGenerate: () => void handleGenerate(),
  };
}
