"use client";

import { useCallback, useMemo, useState } from "react";
import type { SerializedActivity } from "@/lib/activity-action-types";
import { BuilderLayout } from "@/components/shared/BuilderLayout";
import { SavedActivitiesPanel } from "@/components/shared/SavedActivitiesPanel";
import { WordBankModal } from "@/components/shared/WordBankModal";
import { WordSearchActivityPreview } from "@/components/word-search/WordSearchActivityPreview";
import { WordSearchConfigForm } from "@/components/word-search/WordSearchConfigForm";
import type { Phoneme, PhonemeWord } from "@/lib/phoneme-types";
import { findCorpusWord } from "@/lib/phoneme-types";
import { useSavedActivities } from "@/hooks/useSavedActivities";
import { activitySignature, type Difficulty } from "@/lib/activity";
import {
  buildWordSearchCreateInput,
  storedWordToPhonemeWord,
} from "@/lib/activity-service";
import { generateWordSearchHtml } from "@/lib/generate-word-search-html";
import { DIFFICULTY_PRESETS } from "@/lib/wordle";
import {
  DEFAULT_WORD_SEARCH_SEED,
  generateWordSearch,
  GRID_SIZE_BY_DIFFICULTY,
  REQUIRED_WORD_COUNT,
  type WordSearchPuzzle,
} from "@/lib/word-search";

function draftSignature(parts: {
  name: string;
  difficulty: Difficulty;
  words: PhonemeWord[];
  showHints: boolean;
  seed: number;
}): string {
  return JSON.stringify({
    name: parts.name.trim(),
    difficulty: parts.difficulty,
    showHints: parts.showHints,
    seed: parts.seed,
    words: parts.words.map((word) => ({
      id: word.id,
      english: word.english.trim(),
      phonemes: word.phonemes.map((p) => ({
        ipa: p.ipa,
        grapheme: p.grapheme,
        example: p.example,
      })),
    })),
  });
}

function matchCorpusWord(
  corpus: PhonemeWord[],
  word: PhonemeWord,
): PhonemeWord | null {
  const byId = findCorpusWord(corpus, word.id);
  if (byId) return byId;
  return (
    corpus.find(
      (entry) =>
        entry.english.toLowerCase() === word.english.toLowerCase() &&
        entry.phonemes.length === word.phonemes.length,
    ) ?? null
  );
}

export function WordSearchBuilder({
  inventory,
  corpus: initialCorpus,
}: {
  inventory: Phoneme[];
  corpus: PhonemeWord[];
}) {
  const [corpus, setCorpus] = useState(initialCorpus);

  const initialCorpusIds = corpus
    .slice(0, REQUIRED_WORD_COUNT)
    .map((word) => word.id);

  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [wordIds, setWordIds] = useState<string[]>(() => {
    if (initialCorpusIds.length === REQUIRED_WORD_COUNT) {
      return initialCorpusIds;
    }
    return Array.from({ length: REQUIRED_WORD_COUNT }, () => "");
  });
  const [seed, setSeed] = useState(DEFAULT_WORD_SEARCH_SEED);
  const [storedShowHints, setStoredShowHints] = useState<boolean | null>(null);
  const [activityName, setActivityName] = useState("");
  const [loadedFallbacks, setLoadedFallbacks] = useState<PhonemeWord[]>([]);
  const [wordBankOpen, setWordBankOpen] = useState(false);

  const gridSize = GRID_SIZE_BY_DIFFICULTY[difficulty];
  const showHints = storedShowHints ?? DIFFICULTY_PRESETS[difficulty].showHints;

  const words = useMemo<PhonemeWord[]>(() => {
    return wordIds.flatMap((id, index) => {
      const match = findCorpusWord(corpus, id);
      if (match) return [match];
      const fallback = loadedFallbacks[index];
      return fallback && fallback.id === id ? [fallback] : [];
    });
  }, [wordIds, corpus, loadedFallbacks]);

  const wordsSignature = useMemo(() => activitySignature(words), [words]);

  const puzzleResult = useMemo<{
    puzzle: WordSearchPuzzle | null;
    error: string | null;
  }>(() => {
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
  }, [words, gridSize, seed, inventory]);

  const { puzzle } = puzzleResult;
  const canDraftGenerate =
    puzzle !== null && words.length === REQUIRED_WORD_COUNT;

  const signature = useMemo(
    () =>
      draftSignature({
        name: activityName,
        difficulty,
        words,
        showHints,
        seed,
      }),
    [activityName, difficulty, words, showHints, seed],
  );

  const applyLoadedActivity = useCallback(
    (activity: SerializedActivity) => {
      const loadedWords = activity.words.map(storedWordToPhonemeWord);
      if (loadedWords.length !== REQUIRED_WORD_COUNT) {
        throw new Error(
          `Word Search activities need exactly ${REQUIRED_WORD_COUNT} words.`,
        );
      }
      const nextSeed = activity.seed ?? DEFAULT_WORD_SEARCH_SEED;
      const resolved = loadedWords.map((word) => matchCorpusWord(corpus, word));
      const nextIds = loadedWords.map(
        (word, index) => resolved[index]?.id ?? `loaded-${index}-${word.id}`,
      );
      const fallbacks = loadedWords.map((word, index) =>
        resolved[index]
          ? { id: "", english: "", phonemes: [] }
          : { ...word, id: nextIds[index] },
      );
      const effectiveWords = loadedWords.map(
        (word, index) => resolved[index] ?? { ...word, id: nextIds[index] },
      );

      setActivityName(activity.name);
      setDifficulty(activity.difficulty);
      setStoredShowHints(activity.showHints);
      setSeed(nextSeed);
      setWordIds(nextIds);
      setLoadedFallbacks(fallbacks);

      return draftSignature({
        name: activity.name,
        difficulty: activity.difficulty,
        words: effectiveWords,
        showHints: activity.showHints,
        seed: nextSeed,
      });
    },
    [corpus],
  );

  const resetDraft = useCallback(() => {
    const nextIds =
      corpus.length >= REQUIRED_WORD_COUNT
        ? corpus.slice(0, REQUIRED_WORD_COUNT).map((word) => word.id)
        : Array.from({ length: REQUIRED_WORD_COUNT }, () => "");
    const nextWords = nextIds.flatMap((id) => {
      const match = findCorpusWord(corpus, id);
      return match ? [match] : [];
    });
    setDifficulty("medium");
    setWordIds(nextIds);
    setSeed(DEFAULT_WORD_SEARCH_SEED);
    setStoredShowHints(null);
    setActivityName("");
    setLoadedFallbacks([]);
    return draftSignature({
      name: "",
      difficulty: "medium",
      words: nextWords,
      showHints: DIFFICULTY_PRESETS.medium.showHints,
      seed: DEFAULT_WORD_SEARCH_SEED,
    });
  }, [corpus]);

  const buildCreateInput = useCallback(
    (nameOverride?: string) => {
      if (!canDraftGenerate) return null;
      const name = (nameOverride ?? activityName).trim();
      if (!name) return null;
      return buildWordSearchCreateInput({
        name,
        difficulty,
        showHints,
        seed,
        words,
      });
    },
    [activityName, canDraftGenerate, difficulty, showHints, seed, words],
  );

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
    onActivityNameChange: setActivityName,
    draftSignature: signature,
    canDraftGenerate,
    canPersist: canDraftGenerate,
    buildCreateInput,
    applyLoadedActivity,
    resetDraft,
    generateDraftHtml,
    draftGenerateHint:
      puzzleResult.error ??
      (canDraftGenerate
        ? "Download a draft HTML file (save to the database for stored generation)"
        : "Choose five different bank words that fit the grid"),
  });

  function handleWordIdChange(index: number, nextId: string) {
    setWordIds((prev) => prev.map((id, i) => (i === index ? nextId : id)));
    setLoadedFallbacks((prev) => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      next[index] = { id: "", english: "", phonemes: [] };
      return next;
    });
  }

  function handleDifficultyChange(next: Difficulty) {
    setDifficulty(next);
    setStoredShowHints(null);
  }

  function handleCorpusChange(next: PhonemeWord[], selectId?: string) {
    setCorpus(next);
    setWordIds((prev) => {
      const mapped = prev.map((id) => {
        if (selectId && id && !next.some((word) => word.id === id)) {
          // Prefer newly saved id only if this slot lost its word and we have one selectId
          return id;
        }
        if (!id) return id;
        if (next.some((word) => word.id === id)) return id;
        return "";
      });
      if (
        selectId &&
        mapped.every((id) => id !== selectId) &&
        mapped.some((id) => id === "")
      ) {
        const emptyIndex = mapped.findIndex((id) => id === "");
        if (emptyIndex >= 0) {
          const copy = [...mapped];
          copy[emptyIndex] = selectId;
          return copy;
        }
      }
      return mapped;
    });
  }

  return (
    <>
      <BuilderLayout
        library={
          <div className="flex flex-col gap-3">
            <div className="flex justify-end">
              <button
                type="button"
                className="ui-button ui-button-secondary px-3 py-1.5 text-sm"
                onClick={() => setWordBankOpen(true)}
              >
                Add/edit words
              </button>
            </div>
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
          </div>
        }
        config={
          <WordSearchConfigForm
            key={saved.formEpoch}
            wordIds={wordIds}
            words={words}
            corpus={corpus}
            onWordIdChange={handleWordIdChange}
            difficulty={difficulty}
            onDifficultyChange={handleDifficultyChange}
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
          <WordSearchActivityPreview
            puzzle={puzzle}
            words={words}
            showHints={showHints}
            puzzleKey={`${wordsSignature}|${difficulty}|${gridSize}|${seed}`}
            errorMessage={puzzleResult.error}
          />
        }
      />
      {saved.nameDialogNode}
      <WordBankModal
        open={wordBankOpen}
        corpus={corpus}
        inventory={inventory}
        onCorpusChange={handleCorpusChange}
        onClose={() => setWordBankOpen(false)}
      />
    </>
  );
}
