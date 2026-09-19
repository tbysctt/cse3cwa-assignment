"use client";

import type { PhonemeWord } from "@/lib/phoneme-types";
import { ActivityPreviewShell } from "@/components/shared/ActivityPreviewShell";
import type { WordSearchPuzzle } from "@/lib/word-search";
import { WordSearchGame } from "./WordSearchGame";

export function WordSearchActivityPreview({
  puzzle,
  words,
  showHints,
  puzzleKey,
  errorMessage,
}: {
  puzzle: WordSearchPuzzle | null;
  words: PhonemeWord[];
  showHints: boolean;
  puzzleKey: string;
  errorMessage?: string | null;
}) {
  return (
    <ActivityPreviewShell description="The grid is generated from your word list. Drag across a straight horizontal, vertical, or diagonal line of connected phonemes to find a word, or use the keyboard steps shown below.">
      {puzzle ? (
        <WordSearchGame
          key={puzzleKey}
          puzzle={puzzle}
          words={words}
          showHints={showHints}
        />
      ) : (
        <p className="rounded-(--control-radius) border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
          {errorMessage ??
            "Configure all five words to generate the activity preview."}
        </p>
      )}
    </ActivityPreviewShell>
  );
}
