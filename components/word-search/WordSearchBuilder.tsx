"use client";

import { useMemo, useState } from "react";
import { BuilderLayout } from "@/components/shared/BuilderLayout";
import { WordSearchActivityPreview } from "@/components/word-search/WordSearchActivityPreview";
import {
  WordSearchConfigForm,
  type CustomWordEntry,
} from "@/components/word-search/WordSearchConfigForm";
import {
  findCorpusWord,
  WORD_SEARCH_WORDS,
  type Phoneme,
  type PhonemeWord,
} from "@/data/phonemes";
import { downloadTextFile } from "@/lib/download";
import { generateWordSearchHtml } from "@/lib/generate-word-search-html";
import {
  activitySignature,
  type Difficulty,
} from "@/lib/activity";
import {
  parsePhonemeSequence,
  validateCustomWord,
} from "@/lib/custom-phonemes";
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

export function WordSearchBuilder() {
  const [mode, setMode] = useState<"corpus" | "custom">("corpus");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [wordIds, setWordIds] = useState<string[]>(() =>
    WORD_SEARCH_WORDS.map((word) => word.id),
  );

  // Custom words state
  const [customEntries, setCustomEntries] = useState<CustomWordEntry[]>(
    DEFAULT_CUSTOM_WORDS,
  );
  const [activeSlotIndex, setActiveSlotIndex] = useState(0);

  const gridSize = GRID_SIZE_BY_DIFFICULTY[difficulty];
  const showHints = DIFFICULTY_PRESETS[difficulty].showHints;

  // Corpus mode words
  const corpusWords = useMemo<PhonemeWord[]>(() => {
    return wordIds.flatMap((id) => {
      const match = findCorpusWord(id);
      return match ? [match] : [];
    });
  }, [wordIds]);

  // Custom mode words validation
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
        puzzle: generateWordSearch(
          words,
          gridSize,
          DEFAULT_WORD_SEARCH_SEED,
        ),
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
  }, [mode, customValidation, words, gridSize]);

  const { puzzle } = puzzleResult;
  const canGenerate = puzzle !== null && words.length === REQUIRED_WORD_COUNT;

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

  function handleGenerate() {
    if (!puzzle || !canGenerate) return;
    const html = generateWordSearchHtml({
      words,
      puzzle,
      seed: DEFAULT_WORD_SEARCH_SEED,
      difficulty,
      showHints,
    });
    downloadTextFile("phoneme-word-search.html", html);
  }

  return (
    <BuilderLayout
      config={
        <WordSearchConfigForm
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
          onDifficultyChange={setDifficulty}
          canGenerate={canGenerate}
          generateHint={
            canGenerate
              ? "Download the word search as a standalone HTML file"
              : puzzleResult.error ??
                "Choose five different words that fit the grid"
          }
          onGenerate={handleGenerate}
        />
      }
      preview={
        <WordSearchActivityPreview
          puzzle={puzzle}
          words={words}
          showHints={showHints}
          puzzleKey={`${wordsSignature}|${difficulty}|${gridSize}`}
          errorMessage={puzzleResult.error}
        />
      }
    />
  );
}
