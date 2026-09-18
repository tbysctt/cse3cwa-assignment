"use client";

import { useCallback, useMemo, useState } from "react";
import type { SerializedActivity } from "@/lib/activity-action-types";
import { BuilderLayout } from "@/components/shared/BuilderLayout";
import { SavedActivitiesPanel } from "@/components/shared/SavedActivitiesPanel";
import { WordleActivityPreview } from "@/components/wordle/WordleActivityPreview";
import { WordleConfigForm } from "@/components/wordle/WordleConfigForm";
import {
  HCE_PHONEME_INVENTORY,
  WORDLE_TARGET,
  type Phoneme,
  type PhonemeLength,
  type PhonemeWord,
  wordsForLength,
} from "@/data/phonemes";
import { useSavedActivities } from "@/hooks/useSavedActivities";
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
  const [storedMaxAttempts, setStoredMaxAttempts] = useState<number | null>(
    null,
  );
  const [storedShowHints, setStoredShowHints] = useState<boolean | null>(null);

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

  const canDraftGenerate = Boolean(
    targetWord && targetWord.phonemes.length > 0,
  );

  const signature = useMemo(
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

  const applyLoadedActivity = useCallback((activity: SerializedActivity) => {
    const word = activity.words[0]
      ? storedWordToPhonemeWord(activity.words[0])
      : null;
    if (!word) {
      throw new Error("Saved Wordle activity has no target word.");
    }
    setActivityName(activity.name);
    setDifficulty(activity.difficulty);
    setStoredMaxAttempts(activity.maxAttempts);
    setStoredShowHints(activity.showHints);
    setMode("custom");
    setCustomEnglish(word.english);
    setCustomPhonemes(word.phonemes);
    setLength(word.phonemes.length as PhonemeLength);

    return draftSignature({
      name: activity.name,
      difficulty: activity.difficulty,
      mode: "custom",
      target: word,
      maxAttempts:
        activity.maxAttempts ??
        DIFFICULTY_PRESETS[activity.difficulty].maxAttempts,
      showHints: activity.showHints,
    });
  }, []);

  const buildCreateInput = useCallback(() => {
    if (!targetWord) return null;
    return buildWordleCreateInput({
      name: activityName,
      difficulty,
      showHints,
      maxAttempts,
      target: targetWord,
    });
  }, [activityName, difficulty, showHints, maxAttempts, targetWord]);

  const generateDraftHtml = useCallback(() => {
    if (!targetWord) return null;
    return {
      filename: "phoneme-wordle.html",
      html: generateWordleHtml({
        target: targetWord,
        inventory,
        maxAttempts,
        difficulty,
        showHints,
      }),
    };
  }, [targetWord, inventory, maxAttempts, difficulty, showHints]);

  const saved = useSavedActivities({
    activityType: "wordle",
    activityName,
    draftSignature: signature,
    canDraftGenerate,
    buildCreateInput,
    applyLoadedActivity,
    generateDraftHtml,
    draftGenerateHint: canDraftGenerate
      ? "Download a draft HTML file (save to the database for stored generation)"
      : "Configure a valid target word first",
  });

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

  return (
    <BuilderLayout
      config={
        <>
          <SavedActivitiesPanel
            activityName={activityName}
            onActivityNameChange={setActivityName}
            summaries={saved.summaries}
            selectedId={saved.selectedId}
            onSelectedIdChange={saved.onSelectedIdChange}
            savedId={saved.savedId}
            isDirty={saved.isDirty}
            canSave={saved.canSave}
            busy={saved.busy}
            message={saved.message}
            error={saved.error}
            onLoad={saved.onLoad}
            onSave={saved.onSave}
            onSaveAsNew={saved.onSaveAsNew}
            onDelete={saved.onDelete}
          />
          <WordleConfigForm
            key={saved.formEpoch}
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
            maxAttempts={maxAttempts}
            showHints={showHints}
            canGenerate={saved.canGenerate}
            generateHint={saved.generateHint}
            onGenerate={saved.onGenerate}
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
