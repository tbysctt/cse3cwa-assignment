"use client";

import { useMemo, useState } from "react";
import { BuilderLayout } from "@/components/shared/BuilderLayout";
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
import { type Difficulty } from "@/lib/activity";
import {
  parsePhonemeSequence,
  validateCustomWord,
} from "@/lib/custom-phonemes";
import { generateWordleHtml } from "@/lib/generate-wordle-html";
import { DIFFICULTY_PRESETS } from "@/lib/wordle";
import { downloadTextFile } from "@/lib/download";

export function WordleBuilder() {
  const [mode, setMode] = useState<"corpus" | "custom">("corpus");

  // Corpus mode state
  const [length, setLength] = useState<PhonemeLength>(
    WORDLE_TARGET.phonemes.length as PhonemeLength,
  );
  const [wordId, setWordId] = useState(WORDLE_TARGET.id);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");

  // Custom word mode state
  const [customEnglish, setCustomEnglish] = useState("cat");
  const [customPhonemes, setCustomPhonemes] = useState<Phoneme[]>(() =>
    parsePhonemeSequence("/k/ /æ/ /t/"),
  );

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
    return customValidation.valid && customValidation.word ? customValidation.word : null;
  }, [mode, corpusTargetWord, customValidation]);

  const inventory = useMemo(() => {
    if (!targetWord) return HCE_PHONEME_INVENTORY;
    const extras = targetWord.phonemes.filter(
      (phoneme) => !HCE_PHONEME_INVENTORY.some((p) => p.ipa === phoneme.ipa),
    );
    if (extras.length === 0) return HCE_PHONEME_INVENTORY;
    return [...HCE_PHONEME_INVENTORY, ...extras];
  }, [targetWord]);

  const preset = DIFFICULTY_PRESETS[difficulty];
  const canGenerate = Boolean(targetWord && targetWord.phonemes.length > 0);

  function handleLengthChange(next: PhonemeLength) {
    setLength(next);
    const nextWords = wordsForLength(next);
    setWordId(nextWords[0]?.id ?? "");
  }

  function handleGenerate() {
    if (!canGenerate || !targetWord) return;
    const html = generateWordleHtml({
      target: targetWord,
      inventory,
      maxAttempts: preset.maxAttempts,
      difficulty,
      showHints: preset.showHints,
    });
    downloadTextFile("phoneme-wordle.html", html);
  }

  return (
    <BuilderLayout
      config={
        <WordleConfigForm
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
          customError={mode === "custom" && !customValidation.valid ? customValidation.error : null}
          difficulty={difficulty}
          onDifficultyChange={setDifficulty}
          canGenerate={canGenerate}
          onGenerate={handleGenerate}
        />
      }
      preview={
        <WordleActivityPreview
          target={targetWord}
          inventory={inventory}
          maxAttempts={preset.maxAttempts}
          showHints={preset.showHints}
        />
      }
    />
  );
}
