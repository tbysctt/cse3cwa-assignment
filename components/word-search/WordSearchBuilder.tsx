"use client";

import { useCallback, useMemo, useState } from "react";
import type { SerializedActivity } from "@/lib/activity-action-types";
import { BuilderLayout } from "@/components/shared/BuilderLayout";
import { SavedActivitiesPanel } from "@/components/shared/SavedActivitiesPanel";
import { WordSearchActivityPreview } from "@/components/word-search/WordSearchActivityPreview";
import {
  WordSearchConfigForm,
  type CustomWordEntry,
} from "@/components/word-search/WordSearchConfigForm";
import type { Phoneme, PhonemeWord } from "@/lib/phoneme-types";
import { findCorpusWord } from "@/lib/phoneme-types";
import { useSavedActivities } from "@/hooks/useSavedActivities";
import {
  activitySignature,
  type Difficulty,
} from "@/lib/activity";
import {
  buildWordSearchCreateInput,
  storedWordToPhonemeWord,
} from "@/lib/activity-service";
import {
  parsePhonemeSequence,
  validateCustomWord,
} from "@/lib/custom-phonemes";
import { generateWordSearchHtml } from "@/lib/generate-word-search-html";
import { DIFFICULTY_PRESETS } from "@/lib/wordle";
import {
  DEFAULT_WORD_SEARCH_SEED,
  generateWordSearch,
  GRID_SIZE_BY_DIFFICULTY,
  REQUIRED_WORD_COUNT,
  type WordSearchPuzzle,
} from "@/lib/word-search";

function emptyCustomEntries(inventory: Phoneme[]): CustomWordEntry[] {
  const samples = [
    "/k/ /æ/ /t/",
    "/d/ /ɔ/ /ɡ/",
    "/f/ /ɪ/ /ʃ/",
    "/f/ /ɹ/ /ɔ/ /ɡ/",
    "/m/ /ɪ/ /l/ /k/",
  ];
  const labels = ["cat", "dog", "fish", "frog", "milk"];
  return labels.map((english, i) => ({
    english,
    phonemes: parsePhonemeSequence(samples[i], inventory),
  }));
}

function draftSignature(parts: {
  name: string;
  difficulty: Difficulty;
  mode: "corpus" | "custom";
  words: PhonemeWord[];
  showHints: boolean;
  seed: number;
}): string {
  return JSON.stringify({
    name: parts.name.trim(),
    difficulty: parts.difficulty,
    mode: parts.mode,
    showHints: parts.showHints,
    seed: parts.seed,
    words: parts.words.map((word) => ({
      english: word.english.trim(),
      phonemes: word.phonemes.map((p) => ({
        ipa: p.ipa,
        grapheme: p.grapheme,
        example: p.example,
      })),
    })),
  });
}

export function WordSearchBuilder({
  inventory,
  corpus,
}: {
  inventory: Phoneme[];
  corpus: PhonemeWord[];
}) {

  const initialCorpusIds = corpus
    .slice(0, REQUIRED_WORD_COUNT)
    .map((word) => word.id);

  const [mode, setMode] = useState<"corpus" | "custom">("corpus");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [wordIds, setWordIds] = useState<string[]>(() => {
    if (initialCorpusIds.length === REQUIRED_WORD_COUNT) {
      return initialCorpusIds;
    }
    return Array.from({ length: REQUIRED_WORD_COUNT }, () => "");
  });
  const [customEntries, setCustomEntries] = useState<CustomWordEntry[]>(() =>
    emptyCustomEntries(inventory),
  );
  const [activeSlotIndex, setActiveSlotIndex] = useState(0);
  const [seed, setSeed] = useState(DEFAULT_WORD_SEARCH_SEED);
  const [storedShowHints, setStoredShowHints] = useState<boolean | null>(null);
  const [activityName, setActivityName] = useState("");

  const gridSize = GRID_SIZE_BY_DIFFICULTY[difficulty];
  const showHints = storedShowHints ?? DIFFICULTY_PRESETS[difficulty].showHints;

  const corpusWords = useMemo<PhonemeWord[]>(() => {
    return wordIds.flatMap((id) => {
      const match = findCorpusWord(corpus, id);
      return match ? [match] : [];
    });
  }, [wordIds, corpus]);

  const customValidation = useMemo<{
    words: PhonemeWord[];
    error: string | null;
  }>(() => {
    if (customEntries.length !== REQUIRED_WORD_COUNT) {
      return { words: [], error: "Please configure five custom words." };
    }

    const words: PhonemeWord[] = [];
    for (let i = 0; i < customEntries.length; i += 1) {
      const entry = customEntries[i];
      const result = validateCustomWord(entry.english, entry.phonemes, {
        maxLength: gridSize,
        wordIndex: i,
      });
      if (!result.valid || !result.word) {
        return { words: [], error: result.error ?? `Word ${i + 1} is invalid.` };
      }
      words.push({
        id: `custom-${i}-${result.word.id}`,
        english: result.word.english,
        phonemes: result.word.phonemes,
      });
    }

    const uniqueEnglish = new Set(
      words.map((w) => w.english.trim().toLowerCase()),
    );
    if (uniqueEnglish.size !== REQUIRED_WORD_COUNT) {
      return {
        words: [],
        error: "All five custom words must have different English labels.",
      };
    }

    return { words, error: null };
  }, [customEntries, gridSize]);

  const words = mode === "corpus" ? corpusWords : customValidation.words;
  const wordsSignature = useMemo(() => activitySignature(words), [words]);

  const puzzleResult = useMemo<{
    puzzle: WordSearchPuzzle | null;
    error: string | null;
  }>(() => {
    if (mode === "custom" && customValidation.error) {
      return { puzzle: null, error: customValidation.error };
    }
    if (words.length !== REQUIRED_WORD_COUNT) {
      return { puzzle: null, error: null };
    }
    if (new Set(words.map((word) => word.id)).size !== REQUIRED_WORD_COUNT) {
      return {
        puzzle: null,
        error: "Choose five different words.",
      };
    }
    try {
      return {
        puzzle: generateWordSearch(words, gridSize, seed, inventory),
        error: null,
      };
    } catch (error) {
      return {
        puzzle: null,
        error:
          error instanceof Error
            ? error.message
            : "The word search could not be generated.",
      };
    }
  }, [mode, customValidation, words, gridSize, seed, inventory]);

  const { puzzle } = puzzleResult;
  const canDraftGenerate =
    puzzle !== null && words.length === REQUIRED_WORD_COUNT;

  const signature = useMemo(
    () =>
      draftSignature({
        name: activityName,
        difficulty,
        mode,
        words,
        showHints,
        seed,
      }),
    [activityName, difficulty, mode, words, showHints, seed],
  );

  const applyLoadedActivity = useCallback((activity: SerializedActivity) => {
    const loadedWords = activity.words.map(storedWordToPhonemeWord);
    if (loadedWords.length !== REQUIRED_WORD_COUNT) {
      throw new Error(
        `Word Search activities need exactly ${REQUIRED_WORD_COUNT} words.`,
      );
    }
    const nextSeed = activity.seed ?? DEFAULT_WORD_SEARCH_SEED;
    setActivityName(activity.name);
    setDifficulty(activity.difficulty);
    setStoredShowHints(activity.showHints);
    setSeed(nextSeed);
    setMode("custom");
    setCustomEntries(
      loadedWords.map((word) => ({
        english: word.english,
        phonemes: word.phonemes,
      })),
    );
    setActiveSlotIndex(0);

    return draftSignature({
      name: activity.name,
      difficulty: activity.difficulty,
      mode: "custom",
      words: loadedWords,
      showHints: activity.showHints,
      seed: nextSeed,
    });
  }, []);

  const buildCreateInput = useCallback(() => {
    if (!canDraftGenerate) return null;
    return buildWordSearchCreateInput({
      name: activityName,
      difficulty,
      showHints,
      seed,
      words,
    });
  }, [activityName, canDraftGenerate, difficulty, showHints, seed, words]);

  const generateDraftHtml = useCallback(() => {
    if (!puzzle || !canDraftGenerate) return null;
    return {
      filename: "phoneme-word-search.html",
      html: generateWordSearchHtml({
        words,
        puzzle,
        seed,
        difficulty,
        showHints,
      }),
    };
  }, [puzzle, canDraftGenerate, words, seed, difficulty, showHints]);

  const saved = useSavedActivities({
    activityType: "word_search",
    activityName,
    draftSignature: signature,
    canDraftGenerate,
    buildCreateInput,
    applyLoadedActivity,
    generateDraftHtml,
    draftGenerateHint:
      puzzleResult.error ??
      (canDraftGenerate
        ? "Download a draft HTML file (save to the database for stored generation)"
        : "Choose five different words that fit the grid"),
  });

  function handleWordIdChange(index: number, nextId: string) {
    setWordIds((prev) => prev.map((id, i) => (i === index ? nextId : id)));
  }

  function handleCustomEntryChange(index: number, entry: CustomWordEntry) {
    setCustomEntries((prev) =>
      prev.map((item, i) => (i === index ? entry : item)),
    );
  }

  function handleAppendPhonemeToSlot(phoneme: Phoneme) {
    setCustomEntries((prev) =>
      prev.map((item, i) =>
        i === activeSlotIndex
          ? { ...item, phonemes: [...item.phonemes, phoneme] }
          : item,
      ),
    );
  }

  function handleLoadSampleWords() {
    setCustomEntries(emptyCustomEntries(inventory));
  }

  function handleDifficultyChange(next: Difficulty) {
    setDifficulty(next);
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
          <WordSearchConfigForm
            key={saved.formEpoch}
            mode={mode}
            onModeChange={setMode}
            wordIds={wordIds}
            words={words}
            corpus={corpus}
            inventory={inventory}
            onWordIdChange={handleWordIdChange}
            customEntries={customEntries}
            onCustomEntryChange={handleCustomEntryChange}
            onLoadSampleWords={handleLoadSampleWords}
            customError={mode === "custom" ? customValidation.error : null}
            activeSlotIndex={activeSlotIndex}
            onActiveSlotIndexChange={setActiveSlotIndex}
            onAppendPhonemeToSlot={handleAppendPhonemeToSlot}
            difficulty={difficulty}
            onDifficultyChange={handleDifficultyChange}
            canGenerate={saved.canGenerate}
            generateHint={saved.generateHint}
            onGenerate={saved.onGenerate}
          />
        </>
      }
      preview={
        <WordSearchActivityPreview
          puzzle={puzzle}
          words={words}
          showHints={showHints}
          puzzleKey={`${wordsSignature}|${difficulty}|${gridSize}|${seed}`}
          errorMessage={puzzleResult.error}
        />
      }
    />
  );
}
