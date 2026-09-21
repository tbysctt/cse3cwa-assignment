"use client";

import { useCallback, useMemo, useState } from "react";
import type { SerializedActivity } from "@/lib/activity-action-types";
import { BuilderLayout } from "@/components/shared/BuilderLayout";
import { CorpusWordManager } from "@/components/shared/CorpusWordManager";
import { SavedActivitiesPanel } from "@/components/shared/SavedActivitiesPanel";
import { WordleActivityPreview } from "@/components/wordle/WordleActivityPreview";
import { WordleConfigForm } from "@/components/wordle/WordleConfigForm";
import type {
  KeyboardSlot,
  Phoneme,
  PhonemeLength,
  PhonemeWord,
} from "@/lib/phoneme-types";
import { wordsForLength } from "@/lib/phoneme-types";
import { useSavedActivities } from "@/hooks/useSavedActivities";
import { type Difficulty } from "@/lib/activity";
import {
  buildWordleCreateInput,
  inventoryForTarget,
  storedWordToPhonemeWord,
} from "@/lib/activity-service";
import { generateWordleHtml } from "@/lib/generate-wordle-html";
import { DIFFICULTY_PRESETS } from "@/lib/wordle";

function draftSignature(parts: {
  name: string;
  difficulty: Difficulty;
  target: PhonemeWord | null;
  maxAttempts: number;
  showHints: boolean;
}): string {
  return JSON.stringify({
    name: parts.name.trim(),
    difficulty: parts.difficulty,
    maxAttempts: parts.maxAttempts,
    showHints: parts.showHints,
    target: parts.target
      ? {
          id: parts.target.id,
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

function firstWordOfLength(
  corpus: PhonemeWord[],
  length: PhonemeLength,
): PhonemeWord | null {
  return wordsForLength(corpus, length)[0] ?? null;
}

function matchCorpusWord(
  corpus: PhonemeWord[],
  word: PhonemeWord,
): PhonemeWord | null {
  const byId = corpus.find((entry) => entry.id === word.id);
  if (byId) return byId;
  const byEnglish = corpus.find(
    (entry) =>
      entry.english.toLowerCase() === word.english.toLowerCase() &&
      entry.phonemes.length === word.phonemes.length,
  );
  return byEnglish ?? null;
}

export function WordleBuilder({
  inventory: baseInventory,
  keyboardRows,
  corpus: initialCorpus,
}: {
  inventory: Phoneme[];
  keyboardRows: KeyboardSlot[][];
  corpus: PhonemeWord[];
}) {
  const [corpus, setCorpus] = useState(initialCorpus);
  const initialTarget = firstWordOfLength(corpus, 3);

  const [length, setLength] = useState<PhonemeLength>(3);
  const [wordId, setWordId] = useState(initialTarget?.id ?? "");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [activityName, setActivityName] = useState("");
  const [storedMaxAttempts, setStoredMaxAttempts] = useState<number | null>(
    null,
  );
  const [storedShowHints, setStoredShowHints] = useState<boolean | null>(null);
  /** Snapshot used when a loaded activity word is not in the bank. */
  const [loadedFallback, setLoadedFallback] = useState<PhonemeWord | null>(
    null,
  );

  const lengthWords = useMemo(
    () => wordsForLength(corpus, length),
    [corpus, length],
  );

  const targetWord = useMemo<PhonemeWord | null>(() => {
    const fromBank =
      lengthWords.find((entry) => entry.id === wordId) ?? lengthWords[0] ?? null;
    if (fromBank) return fromBank;
    if (
      loadedFallback &&
      loadedFallback.phonemes.length === length &&
      (loadedFallback.id === wordId || !fromBank)
    ) {
      return loadedFallback;
    }
    return null;
  }, [lengthWords, wordId, loadedFallback, length]);

  const preset = DIFFICULTY_PRESETS[difficulty];
  const maxAttempts = storedMaxAttempts ?? preset.maxAttempts;
  const showHints = storedShowHints ?? preset.showHints;

  const inventory = useMemo(() => {
    if (!targetWord) return baseInventory;
    return inventoryForTarget(targetWord, baseInventory);
  }, [targetWord, baseInventory]);

  const canDraftGenerate = Boolean(
    targetWord && targetWord.phonemes.length > 0,
  );
  const canPersist = Boolean(
    targetWord &&
      (targetWord.phonemes.length === 3 ||
        targetWord.phonemes.length === 4 ||
        targetWord.phonemes.length === 5),
  );

  const signature = useMemo(
    () =>
      draftSignature({
        name: activityName,
        difficulty,
        target: targetWord,
        maxAttempts,
        showHints,
      }),
    [activityName, difficulty, targetWord, maxAttempts, showHints],
  );

  const applyLoadedActivity = useCallback(
    (activity: SerializedActivity) => {
      const word = activity.words[0]
        ? storedWordToPhonemeWord(activity.words[0])
        : null;
      if (!word) {
        throw new Error("Saved Wordle activity has no target word.");
      }
      const matched = matchCorpusWord(corpus, word);
      const effective = matched ?? word;
      setActivityName(activity.name);
      setDifficulty(activity.difficulty);
      setStoredMaxAttempts(activity.maxAttempts);
      setStoredShowHints(activity.showHints);
      setLength(effective.phonemes.length as PhonemeLength);
      setWordId(effective.id);
      setLoadedFallback(matched ? null : word);

      return draftSignature({
        name: activity.name,
        difficulty: activity.difficulty,
        target: effective,
        maxAttempts:
          activity.maxAttempts ??
          DIFFICULTY_PRESETS[activity.difficulty].maxAttempts,
        showHints: activity.showHints,
      });
    },
    [corpus],
  );

  const resetDraft = useCallback(() => {
    const nextTarget = firstWordOfLength(corpus, 3);
    setLength(3);
    setWordId(nextTarget?.id ?? "");
    setDifficulty("medium");
    setActivityName("");
    setStoredMaxAttempts(null);
    setStoredShowHints(null);
    setLoadedFallback(null);
    return draftSignature({
      name: "",
      difficulty: "medium",
      target: nextTarget,
      maxAttempts: DIFFICULTY_PRESETS.medium.maxAttempts,
      showHints: DIFFICULTY_PRESETS.medium.showHints,
    });
  }, [corpus]);

  const buildCreateInput = useCallback(
    (nameOverride?: string) => {
      if (!targetWord) return null;
      const name = (nameOverride ?? activityName).trim();
      if (!name) return null;
      return buildWordleCreateInput({
        name,
        difficulty,
        showHints,
        maxAttempts,
        target: targetWord,
      });
    },
    [activityName, difficulty, showHints, maxAttempts, targetWord],
  );

  const generateDraftHtml = useCallback(() => {
    if (!targetWord) return null;
    return {
      filename: "phoneme-wordle.html",
      html: generateWordleHtml({
        target: targetWord,
        inventory,
        keyboardRows,
        maxAttempts,
        difficulty,
        showHints,
      }),
    };
  }, [
    targetWord,
    inventory,
    keyboardRows,
    maxAttempts,
    difficulty,
    showHints,
  ]);

  const saved = useSavedActivities({
    activityType: "wordle",
    activityName,
    onActivityNameChange: setActivityName,
    draftSignature: signature,
    canDraftGenerate,
    canPersist,
    buildCreateInput,
    applyLoadedActivity,
    resetDraft,
    generateDraftHtml,
    draftGenerateHint: canDraftGenerate
      ? "Download a draft HTML file (save to the database for stored generation)"
      : "Choose a word from the bank first",
  });

  function handleLengthChange(next: PhonemeLength) {
    setLength(next);
    setLoadedFallback(null);
    const nextWords = wordsForLength(corpus, next);
    setWordId(nextWords[0]?.id ?? "");
  }

  function handleDifficultyChange(next: Difficulty) {
    setDifficulty(next);
    setStoredMaxAttempts(null);
    setStoredShowHints(null);
  }

  function handleCorpusChange(next: PhonemeWord[], selectId?: string) {
    setCorpus(next);
    const preferred = selectId ?? wordId;
    if (preferred && next.some((word) => word.id === preferred)) {
      setWordId(preferred);
      setLoadedFallback(null);
      return;
    }
    const fallback = firstWordOfLength(next, length);
    setWordId(fallback?.id ?? "");
    setLoadedFallback(null);
  }

  return (
    <>
      <BuilderLayout
        library={
          <>
            <SavedActivitiesPanel
              summaries={saved.summaries}
              selectedId={saved.selectedId}
              savedId={saved.savedId}
              isDirty={saved.isDirty}
              busy={saved.busy}
              message={saved.message}
              error={saved.error}
              onCreateNew={saved.onCreateNew}
              onSelectActivity={saved.onSelectActivity}
              onRename={saved.onRename}
              onDelete={saved.onDelete}
            />
            <CorpusWordManager
              corpus={corpus}
              inventory={baseInventory}
              onCorpusChange={handleCorpusChange}
            />
          </>
        }
        config={
          <WordleConfigForm
            key={saved.formEpoch}
            length={length}
            onLengthChange={handleLengthChange}
            wordId={targetWord?.id ?? ""}
            onWordIdChange={(next) => {
              setWordId(next);
              setLoadedFallback(null);
            }}
            lengthWords={lengthWords}
            difficulty={difficulty}
            onDifficultyChange={handleDifficultyChange}
            maxAttempts={maxAttempts}
            showHints={showHints}
            canGenerate={saved.canGenerate}
            generateHint={saved.generateHint}
            onGenerate={saved.onGenerate}
            canSave={saved.canSave}
            canSaveAsNew={saved.canSaveAsNew}
            saveBusy={saved.busy}
            onSave={saved.onSave}
            onSaveAsNew={saved.onSaveAsNew}
          />
        }
        preview={
          <WordleActivityPreview
            target={targetWord}
            inventory={inventory}
            keyboardRows={keyboardRows}
            maxAttempts={maxAttempts}
            showHints={showHints}
          />
        }
      />
      {saved.nameDialogNode}
    </>
  );
}
