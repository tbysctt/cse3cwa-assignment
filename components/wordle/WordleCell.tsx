import type { Phoneme } from "@/lib/phoneme-types";
import { formatIpa } from "@/lib/phoneme-types";
import { tileStatusClass, tileStatusLabel } from "@/lib/tile-styles";
import type { TileStatus } from "@/lib/wordle";

export function WordleCell({
  phoneme,
  status,
  showHint,
}: {
  phoneme?: Phoneme;
  status?: TileStatus;
  showHint: boolean;
}) {
  const label = phoneme
    ? `${formatIpa(phoneme.ipa)}${
        status ? ` — ${tileStatusLabel(status)}` : ""
      }`
    : "Empty cell";

  return (
    <div
      role="gridcell"
      aria-label={label}
      className={[
        "flex min-h-12 flex-col items-center justify-center rounded-(--control-radius) border-2 font-mono text-base transition-colors",
        tileStatusClass(status),
      ].join(" ")}
    >
      {phoneme ? (
        <>
          <span aria-hidden="true">{formatIpa(phoneme.ipa)}</span>
          {showHint ? (
            <span className="mt-0.5 text-[0.65rem] font-sans font-semibold uppercase tracking-wide opacity-90">
              {phoneme.grapheme}
            </span>
          ) : null}
        </>
      ) : (
        <span className="opacity-30" aria-hidden="true">
          ·
        </span>
      )}
    </div>
  );
}
