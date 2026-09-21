import type { Phoneme } from "@/lib/phoneme-types";
import type { TileStatus } from "@/lib/wordle";
import { WordleCell } from "./WordleCell";

export type WordleRowView = {
  phonemes: (Phoneme | undefined)[];
  statuses: (TileStatus | undefined)[];
};

export function WordleRow({
  row,
  columns,
  showHint,
}: {
  row: WordleRowView;
  columns: string;
  showHint: boolean;
}) {
  return (
    <div role="row" className="grid gap-2" style={{ gridTemplateColumns: columns }}>
      {row.phonemes.map((phoneme, index) => (
        <WordleCell
          key={`${index}-${phoneme?.ipa ?? "empty"}`}
          phoneme={phoneme}
          status={row.statuses[index]}
          showHint={showHint}
        />
      ))}
    </div>
  );
}
