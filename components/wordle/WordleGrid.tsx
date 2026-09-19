import { useMemo } from "react";
import type { Phoneme } from "@/lib/phoneme-types";
import type { GuessResult } from "@/lib/wordle";
import { WordleRow, type WordleRowView } from "./WordleRow";

export type SubmittedWordleRow = {
  guess: Phoneme[];
  result: GuessResult;
};

export function WordleGrid({
  maxAttempts,
  length,
  submitted,
  current,
  showHint,
}: {
  maxAttempts: number;
  length: number;
  submitted: SubmittedWordleRow[];
  current: Phoneme[];
  showHint: boolean;
}) {
  const columns = `repeat(${length}, minmax(0, 1fr))`;

  const rows = useMemo<WordleRowView[]>(() => {
    const views: WordleRowView[] = [];
    for (let rowIndex = 0; rowIndex < maxAttempts; rowIndex += 1) {
      const submittedRow = submitted[rowIndex];
      if (submittedRow) {
        views.push({
          phonemes: [...submittedRow.guess],
          statuses: [...submittedRow.result],
        });
        continue;
      }
      if (rowIndex === submitted.length) {
        const padded: (Phoneme | undefined)[] = Array.from(
          { length },
          (_, colIndex) => current[colIndex],
        );
        views.push({ phonemes: padded, statuses: Array(length).fill(undefined) });
        continue;
      }
      views.push({
        phonemes: Array.from({ length }, () => undefined),
        statuses: Array(length).fill(undefined),
      });
    }
    return views;
  }, [maxAttempts, length, submitted, current]);

  return (
    <div
      role="grid"
      aria-label={`Phoneme Wordle board with ${maxAttempts} guesses`}
      className="flex flex-col gap-2"
    >
      {rows.map((row, index) => (
        <WordleRow
          key={index}
          row={row}
          columns={columns}
          showHint={showHint}
        />
      ))}
    </div>
  );
}
