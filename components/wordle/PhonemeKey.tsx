import { PhonemeGlyph } from "@/components/phoneme/PhonemeGlyph";
import type { Phoneme } from "@/lib/phoneme-types";

export function PhonemeKey({
  phoneme,
  showHint,
  disabled,
  onPress,
}: {
  phoneme: Phoneme;
  showHint: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <PhonemeGlyph
      as="button"
      className="w-full min-w-0 flex-col text-sm"
      phoneme={phoneme}
      showGrapheme={showHint}
      showHint={showHint}
      disabled={disabled}
      onClick={onPress}
    />
  );
}
