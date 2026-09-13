"use client";

import type { Phoneme, PhonemeWord } from "@/data/phonemes";
import { ActivityPreviewShell } from "@/components/shared/ActivityPreviewShell";
import { activitySignature } from "@/lib/activity";
import { WordleGame } from "./WordleGame";

/**
 * Wraps the playable Wordle game in a visually distinct "Activity Preview"
 * card so teachers can clearly tell the editor apart from the student-facing
 * output. The game is remounted whenever the target word or guess count
 * changes so editing the configuration does not corrupt an active game.
 */
export function WordleActivityPreview({
  target,
  inventory,
  maxAttempts,
  showHints,
}: {
  target: PhonemeWord | null;
  inventory: Phoneme[];
  maxAttempts: number;
  showHints: boolean;
}) {
  const gameKey = target ? `${activitySignature([target])}|${maxAttempts}` : "empty";

  return (
    <ActivityPreviewShell
      description={
        <>
          Play the current student activity.
          {showHints
            ? " Hover or focus a phoneme key for a hint."
            : " Phoneme hints are currently switched off."}
        </>
      }
    >
      {target && target.phonemes.length > 0 && target.english.trim() ? (
        <WordleGame
          key={gameKey}
          target={target}
          inventory={inventory}
          maxAttempts={maxAttempts}
          showHints={showHints}
        />
      ) : (
        <p className="rounded-[var(--control-radius)] border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
          Select a corpus word or enter a valid custom word to preview the activity.
        </p>
      )}
    </ActivityPreviewShell>
  );
}
