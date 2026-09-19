import type {
  KeyboardSlot,
  Phoneme,
} from "@/lib/phoneme-types";
import { PhonemeKey } from "./PhonemeKey";

function rowsForInventory(
  inventory: Phoneme[],
  keyboardRows: KeyboardSlot[][],
): KeyboardSlot[][] {
  const allowed = new Set(inventory.map((phoneme) => phoneme.ipa));
  const byIpa = new Map(inventory.map((phoneme) => [phoneme.ipa, phoneme]));
  const drawn = new Set<string>();

  const rows = keyboardRows.map((row) =>
    row.map((slot) => {
      if (slot === null) return null;
      if (!allowed.has(slot.ipa)) return null;
      drawn.add(slot.ipa);
      return byIpa.get(slot.ipa) ?? slot;
    }),
  );

  const extras = inventory.filter((phoneme) => !drawn.has(phoneme.ipa));
  if (extras.length > 0) {
    const padded: KeyboardSlot[] = [...extras];
    while (padded.length % 4 !== 0) padded.push(null);
    for (let i = 0; i < padded.length; i += 4) {
      rows.push(padded.slice(i, i + 4));
    }
  }

  return rows;
}

export function PhonemeKeyboard({
  inventory,
  keyboardRows,
  showHint,
  disabled,
  onKeyPress,
}: {
  inventory: Phoneme[];
  keyboardRows: KeyboardSlot[][];
  showHint: boolean;
  disabled?: boolean;
  onKeyPress: (phoneme: Phoneme) => void;
}) {
  const rows = rowsForInventory(inventory, keyboardRows);

  return (
    <div
      role="group"
      aria-label="Phoneme keyboard"
      className="flex flex-col gap-1.5"
    >
      {rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="grid grid-cols-4 gap-1.5"
          role="presentation"
        >
          {row.map((slot, slotIndex) =>
            slot ? (
              <PhonemeKey
                key={slot.ipa}
                phoneme={slot}
                showHint={showHint}
                disabled={disabled}
                onPress={() => onKeyPress(slot)}
              />
            ) : (
              <span
                key={`blank-${rowIndex}-${slotIndex}`}
                aria-hidden="true"
                className="min-h-11"
              />
            ),
          )}
        </div>
      ))}
    </div>
  );
}
