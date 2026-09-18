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
import { WordSearchActivityPreview } from "@/components/word-search/WordSearchActivityPreview";
import {
  WordSearchConfigForm,
  type CustomWordEntry,
} from "@/components/word-search/WordSearchConfigForm";
import type { ActivitySummary } from "@/dal";
import {
  findCorpusWord,
  WORD_SEARCH_WORDS,
  type Phoneme,
  type PhonemeWord,
} from "@/data/phonemes";
import {
  activitySignature,
  type Difficulty,
} from "@/lib/activity";
import {
  buildWordSearchCreateInput,
  storedWordToPhonemeWord,
  wordToInput,
} from "@/lib/activity-service";
import {
  parsePhonemeSequence,
  validateCustomWord,
} from "@/lib/custom-phonemes";
import { downloadTextFile } from "@/lib/download";
import { generateWordSearchHtml } from "@/lib/generate-word-search-html";
import { DIFFICULTY_PRESETS } from "@/lib/wordle";
import {
  DEFAULT_WORD_SEARCH_SEED,
  generateWordSearch,
  GRID_SIZE_BY_DIFFICULTY,
  REQUIRED_WORD_COUNT,
  type WordSearchPuzzle,
} from "@/lib/word-search";

const DEFAULT_CUSTOM_WORDS: CustomWordEntry[] = [
  { english: "cat", phonemes: parsePhonemeSequence("/k/ /æ/ /t/") },
  { english: "dog", phonemes: parsePhonemeSequence("/d/ /ɔ/ /ɡ/") },
  { english: "fish", phonemes: parsePhonemeSequence("/f/ /ɪ/ /ʃ/") },
  { english: "frog", phonemes: parsePhonemeSequence("/f/ /ɹ/ /ɔ/ /ɡ/") },
  { english: "milk", phonemes: parsePhonemeSequence("/m/ /ɪ/ /l/ /k/") },
];

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

export function WordSearchBuilder() {
  const [mode, setMode] = useState<"corpus" | "custom">("corpus");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [wordIds, setWordIds] = useState<string[]>(() =>
    WORD_SEARCH_WORDS.map((word) => word.id),
  );
  const [customEntries, setCustomEntries] = useState<CustomWordEntry[]>(
    DEFAULT_CUSTOM_WORDS,
  );
  const [activeSlotIndex, setActiveSlotIndex] = useState(0);
  const [seed, setSeed] = useState(DEFAULT_WORD_SEARCH_SEED);
  const [storedShowHints, setStoredShowHints] = useState<boolean | null>(null);

  const [activityName, setActivityName] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [summaries, setSummaries] = useState<ActivitySummary[]>([]);
  const [cleanSignature, setCleanSignature] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [formEpoch, setFormEpoch] = useState(0);

  const gridSize = GRID_SIZE_BY_DIFFICULTY[difficulty];
  const showHints = storedShowHints ?? DIFFICULTY_PRESETS[difficulty].showHints;

  const corpusWords = useMemo<PhonemeWord[]>(() => {
    return wordIds.flatMap((id) => {
      const match = findCorpusWord(id);
      return match ? [match] : [];
    });
  }, [wordIds]);

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
        puzzle: generateWordSearch(words, gridSize, seed),
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
  }, [mode, customValidation, words, gridSize, seed]);

  const { puzzle } = puzzleResult;
  const canDraftGenerate =
    puzzle !== null && words.length === REQUIRED_WORD_COUNT;

  const currentSignature = useMemo(
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

  const isDirty =
    savedId !== null &&
    cleanSignature !== null &&
    currentSignature !== cleanSignature;

  const canSave = Boolean(activityName.trim() && canDraftGenerate);
  const canGenerateFromDb = Boolean(savedId && !isDirty);
  const canGenerate = canGenerateFromDb || (!savedId && canDraftGenerate);

  const refreshSummaries = useCallback(async () => {
    const result = await listActivitiesAction("word_search");
    if (result.ok) {
      setSummaries(result.data);
    }
  }, []);

  useEffect(() => {
    void refreshSummaries();
  }, [refreshSummaries]);

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
    setCustomEntries(DEFAULT_CUSTOM_WORDS);
  }

  function handleDifficultyChange(next: Difficulty) {
    setDifficulty(next);
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
    const loadedWords = activity.words.map(storedWordToPhonemeWord);
    if (loadedWords.length !== REQUIRED_WORD_COUNT) {
      setStatusError(
        `Word Search activities need exactly ${REQUIRED_WORD_COUNT} words.`,
      );
      return;
    }

    setActivityName(activity.name);
    setSavedId(activity.id);
    setSelectedId(activity.id);
    setDifficulty(activity.difficulty);
    setStoredShowHints(activity.showHints);
    setSeed(activity.seed ?? DEFAULT_WORD_SEARCH_SEED);
    setMode("custom");
    setCustomEntries(
      loadedWords.map((word) => ({
        english: word.english,
        phonemes: word.phonemes,
      })),
    );
    setActiveSlotIndex(0);

    const signature = draftSignature({
      name: activity.name,
      difficulty: activity.difficulty,
      mode: "custom",
      words: loadedWords,
      showHints: activity.showHints,
      seed: activity.seed ?? DEFAULT_WORD_SEARCH_SEED,
    });
    setCleanSignature(signature);
    setFormEpoch((epoch) => epoch + 1);
    setStatusMessage(`Loaded “${activity.name}”.`);
  }

  async function handleSaveAsNew() {
    if (!canSave) return;
    setBusy(true);
    setStatusError(null);
    setStatusMessage(null);
    const result = await createActivityAction(
      buildWordSearchCreateInput({
        name: activityName,
        difficulty,
        showHints,
        seed,
        words,
      }),
    );
    setBusy(false);
    if (!result.ok) {
      setStatusError(result.error);
      return;
    }
    setSavedId(result.data.id);
    setSelectedId(result.data.id);
    setCleanSignature(currentSignature);
    await refreshSummaries();
    setStatusMessage(`Saved “${result.data.name}”.`);
  }

  async function handleSave() {
    if (!savedId || !canSave) return;
    setBusy(true);
    setStatusError(null);
    setStatusMessage(null);
    const result = await updateActivityAction(savedId, {
      name: activityName,
      difficulty,
      showHints,
      seed,
      words: words.map(wordToInput),
    });
    setBusy(false);
    if (!result.ok) {
      setStatusError(result.error);
      return;
    }
    setCleanSignature(currentSignature);
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
      setStatusError(
        "Save your changes before generating HTML from the database.",
      );
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

    if (!puzzle || !canDraftGenerate) return;
    const html = generateWordSearchHtml({
      words,
      puzzle,
      seed,
      difficulty,
      showHints,
    });
    downloadTextFile("phoneme-word-search.html", html);
  }

  const generateHint = canGenerateFromDb
    ? "Download HTML built from the saved database configuration"
    : savedId && isDirty
      ? "Save your changes before generating from the database"
      : canDraftGenerate
        ? "Download a draft HTML file (save to the database for stored generation)"
        : puzzleResult.error ??
          "Choose five different words that fit the grid";

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
          <WordSearchConfigForm
            key={formEpoch}
            mode={mode}
            onModeChange={setMode}
            wordIds={wordIds}
            words={words}
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
            canGenerate={canGenerate}
            generateHint={generateHint}
            onGenerate={() => void handleGenerate()}
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
