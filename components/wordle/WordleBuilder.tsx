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
import { BuilderLayout } from "@/components/shared/BuilderLayout";
import { SavedActivitiesPanel } from "@/components/shared/SavedActivitiesPanel";
import { WordleActivityPreview } from "@/components/wordle/WordleActivityPreview";
import { WordleConfigForm } from "@/components/wordle/WordleConfigForm";
import type { ActivitySummary } from "@/dal";
import {
  HCE_PHONEME_INVENTORY,
  WORDLE_TARGET,
  type Phoneme,
  type PhonemeLength,
  type PhonemeWord,
  wordsForLength,
} from "@/data/phonemes";
import { type Difficulty } from "@/lib/activity";
import {
  buildWordleCreateInput,
  inventoryForTarget,
  storedWordToPhonemeWord,
} from "@/lib/activity-service";
import {
  parsePhonemeSequence,
  validateCustomWord,
} from "@/lib/custom-phonemes";
import { downloadTextFile } from "@/lib/download";
import { generateWordleHtml } from "@/lib/generate-wordle-html";
import { DIFFICULTY_PRESETS } from "@/lib/wordle";

function draftSignature(parts: {
  name: string;
  difficulty: Difficulty;
  mode: "corpus" | "custom";
  target: PhonemeWord | null;
  maxAttempts: number;
  showHints: boolean;
}): string {
  return JSON.stringify({
    name: parts.name.trim(),
    difficulty: parts.difficulty,
    mode: parts.mode,
    maxAttempts: parts.maxAttempts,
    showHints: parts.showHints,
    target: parts.target
      ? {
          english: parts.target.english.trim(),
          phonemes: parts.target.phonemes.map((p) => ({
            ipa: p.ipa,
            grapheme: p.grapheme,
            example: p.example,
          })),
        }
      : null,
  });
}

export function WordleBuilder() {
  const [mode, setMode] = useState<"corpus" | "custom">("corpus");
  const [length, setLength] = useState<PhonemeLength>(
    WORDLE_TARGET.phonemes.length as PhonemeLength,
  );
  const [wordId, setWordId] = useState(WORDLE_TARGET.id);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [customEnglish, setCustomEnglish] = useState("cat");
  const [customPhonemes, setCustomPhonemes] = useState<Phoneme[]>(() =>
    parsePhonemeSequence("/k/ /æ/ /t/"),
  );

  const [activityName, setActivityName] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [summaries, setSummaries] = useState<ActivitySummary[]>([]);
  const [cleanSignature, setCleanSignature] = useState<string | null>(null);
  const [storedMaxAttempts, setStoredMaxAttempts] = useState<number | null>(
    null,
  );
  const [storedShowHints, setStoredShowHints] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [formEpoch, setFormEpoch] = useState(0);

  const lengthWords = useMemo(() => wordsForLength(length), [length]);

  const corpusTargetWord = useMemo<PhonemeWord>(() => {
    return lengthWords.find((entry) => entry.id === wordId) ?? lengthWords[0];
  }, [lengthWords, wordId]);

  const customValidation = useMemo(
    () => validateCustomWord(customEnglish, customPhonemes),
    [customEnglish, customPhonemes],
  );

  const targetWord = useMemo<PhonemeWord | null>(() => {
    if (mode === "corpus") return corpusTargetWord;
    return customValidation.valid && customValidation.word
      ? customValidation.word
      : null;
  }, [mode, corpusTargetWord, customValidation]);

  const preset = DIFFICULTY_PRESETS[difficulty];
  const maxAttempts = storedMaxAttempts ?? preset.maxAttempts;
  const showHints = storedShowHints ?? preset.showHints;

  const inventory = useMemo(() => {
    if (!targetWord) return HCE_PHONEME_INVENTORY;
    return inventoryForTarget(targetWord);
  }, [targetWord]);

  const currentSignature = useMemo(
    () =>
      draftSignature({
        name: activityName,
        difficulty,
        mode,
        target: targetWord,
        maxAttempts,
        showHints,
      }),
    [activityName, difficulty, mode, targetWord, maxAttempts, showHints],
  );

  const isDirty =
    savedId !== null &&
    cleanSignature !== null &&
    currentSignature !== cleanSignature;

  const canDraftGenerate = Boolean(targetWord && targetWord.phonemes.length > 0);
  const canSave = Boolean(activityName.trim() && canDraftGenerate);
  const canGenerateFromDb = Boolean(savedId && !isDirty);
  const canGenerate = canGenerateFromDb || (!savedId && canDraftGenerate);

  const refreshSummaries = useCallback(async () => {
    const result = await listActivitiesAction("wordle");
    if (result.ok) {
      setSummaries(result.data);
    }
  }, []);

  useEffect(() => {
    void refreshSummaries();
  }, [refreshSummaries]);

  function markClean(signature: string) {
    setCleanSignature(signature);
  }

  function handleLengthChange(next: PhonemeLength) {
    setLength(next);
    const nextWords = wordsForLength(next);
    setWordId(nextWords[0]?.id ?? "");
  }

  function handleDifficultyChange(next: Difficulty) {
    setDifficulty(next);
    setStoredMaxAttempts(null);
    setStoredShowHints(null);
  }

  async function handleLoad() {
    if (!selectedId) return;
    setBusy(true);
    setStatusError(null);
    setStatusMessage(null);
    const result = await getActivityAction(selectedId);
    setBusy(false);
    if (!result.ok) {
      setStatusError(result.error);
      return;
    }

    const activity = result.data;
    const word = activity.words[0]
      ? storedWordToPhonemeWord(activity.words[0])
      : null;
    if (!word) {
      setStatusError("Saved Wordle activity has no target word.");
      return;
    }

    setActivityName(activity.name);
    setSavedId(activity.id);
    setSelectedId(activity.id);
    setDifficulty(activity.difficulty);
    setStoredMaxAttempts(activity.maxAttempts);
    setStoredShowHints(activity.showHints);
    setMode("custom");
    setCustomEnglish(word.english);
    setCustomPhonemes(word.phonemes);
    setLength(word.phonemes.length as PhonemeLength);

    const signature = draftSignature({
      name: activity.name,
      difficulty: activity.difficulty,
      mode: "custom",
      target: word,
      maxAttempts:
        activity.maxAttempts ??
        DIFFICULTY_PRESETS[activity.difficulty].maxAttempts,
      showHints: activity.showHints,
    });
    markClean(signature);
    setFormEpoch((epoch) => epoch + 1);
    setStatusMessage(`Loaded “${activity.name}”.`);
  }

  async function handleSaveAsNew() {
    if (!targetWord || !canSave) return;
    setBusy(true);
    setStatusError(null);
    setStatusMessage(null);
    const result = await createActivityAction(
      buildWordleCreateInput({
        name: activityName,
        difficulty,
        showHints,
        maxAttempts,
        target: targetWord,
      }),
    );
    setBusy(false);
    if (!result.ok) {
      setStatusError(result.error);
      return;
    }
    setSavedId(result.data.id);
    setSelectedId(result.data.id);
    markClean(currentSignature);
    await refreshSummaries();
    setStatusMessage(`Saved “${result.data.name}”.`);
  }

  async function handleSave() {
    if (!savedId || !targetWord || !canSave) return;
    setBusy(true);
    setStatusError(null);
    setStatusMessage(null);
    const result = await updateActivityAction(savedId, {
      name: activityName,
      difficulty,
      showHints,
      maxAttempts,
      words: [
        {
          english: targetWord.english,
          phonemes: targetWord.phonemes.map((p) => ({
            ipa: p.ipa,
            grapheme: p.grapheme,
            example: p.example,
          })),
        },
      ],
    });
    setBusy(false);
    if (!result.ok) {
      setStatusError(result.error);
      return;
    }
    markClean(currentSignature);
    await refreshSummaries();
    setStatusMessage(`Updated “${result.data.name}”.`);
  }

  async function handleDelete() {
    if (!selectedId) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm("Delete this saved activity permanently?")
    ) {
      return;
    }
    setBusy(true);
    setStatusError(null);
    setStatusMessage(null);
    const result = await deleteActivityAction(selectedId);
    setBusy(false);
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
  }

  async function handleGenerate() {
    if (savedId && isDirty) {
      setStatusError("Save your changes before generating HTML from the database.");
      return;
    }

    if (canGenerateFromDb && savedId) {
      setBusy(true);
      setStatusError(null);
      const result = await generateStoredActivityHtmlAction(savedId);
      setBusy(false);
      if (!result.ok) {
        setStatusError(result.error);
        return;
      }
      downloadTextFile(result.data.filename, result.data.html);
      setStatusMessage("Downloaded HTML generated from stored database data.");
      return;
    }

    if (!canDraftGenerate || !targetWord) return;
    const html = generateWordleHtml({
      target: targetWord,
      inventory,
      maxAttempts,
      difficulty,
      showHints,
    });
    downloadTextFile("phoneme-wordle.html", html);
  }

  const generateHint = canGenerateFromDb
    ? "Download HTML built from the saved database configuration"
    : savedId && isDirty
      ? "Save your changes before generating from the database"
      : canDraftGenerate
        ? "Download a draft HTML file (save to the database for stored generation)"
        : "Configure a valid target word first";

  return (
    <BuilderLayout
      config={
        <>
          <SavedActivitiesPanel
            activityName={activityName}
            onActivityNameChange={setActivityName}
            summaries={summaries}
            selectedId={selectedId}
            onSelectedIdChange={setSelectedId}
            savedId={savedId}
            isDirty={isDirty}
            canSave={canSave}
            busy={busy}
            message={statusMessage}
            error={statusError}
            onLoad={() => void handleLoad()}
            onSave={() => void handleSave()}
            onSaveAsNew={() => void handleSaveAsNew()}
            onDelete={() => void handleDelete()}
          />
          <WordleConfigForm
            key={formEpoch}
            mode={mode}
            onModeChange={setMode}
            length={length}
            onLengthChange={handleLengthChange}
            wordId={corpusTargetWord.id}
            onWordIdChange={setWordId}
            lengthWords={lengthWords}
            customEnglish={customEnglish}
            onCustomEnglishChange={setCustomEnglish}
            customPhonemes={customPhonemes}
            onCustomPhonemesChange={setCustomPhonemes}
            customError={
              mode === "custom" && !customValidation.valid
                ? customValidation.error
                : null
            }
            difficulty={difficulty}
            onDifficultyChange={handleDifficultyChange}
            canGenerate={canGenerate}
            generateHint={generateHint}
            onGenerate={() => void handleGenerate()}
          />
        </>
      }
      preview={
        <WordleActivityPreview
          target={targetWord}
          inventory={inventory}
          maxAttempts={maxAttempts}
          showHints={showHints}
        />
      }
    />
  );
}
