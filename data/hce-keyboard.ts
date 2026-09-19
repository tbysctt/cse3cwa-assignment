import type { Phoneme, KeyboardSlot } from "@/lib/phoneme-types";

export const HCE_KEYBOARD_ROWS: KeyboardSlot[][] = [
  [
    { ipa: "p", grapheme: "P", example: "as in stop" },
    { ipa: "t", grapheme: "T", example: "as in tent" },
    { ipa: "k", grapheme: "K", example: "as in book" },
    null,
  ],
  [
    { ipa: "b", grapheme: "B", example: "as in bed" },
    { ipa: "d", grapheme: "D", example: "as in bed" },
    { ipa: "ɡ", grapheme: "G", example: "as in log" },
    null,
  ],
  [
    { ipa: "n", grapheme: "N", example: "as in thin" },
    { ipa: "m", grapheme: "M", example: "as in jam" },
    { ipa: "ŋ", grapheme: "NG", example: "as in ring" },
    null,
  ],
  [
    { ipa: "f", grapheme: "F", example: "as in fan" },
    { ipa: "s", grapheme: "S", example: "as in sun" },
    { ipa: "θ", grapheme: "TH", example: "as in thin" },
    { ipa: "ʃ", grapheme: "SH", example: "as in ship" },
  ],
  [
    { ipa: "v", grapheme: "V", example: "as in van" },
    { ipa: "z", grapheme: "Z", example: "as in zip" },
    { ipa: "ð", grapheme: "DH", example: "as in then" },
    { ipa: "ʒ", grapheme: "ZH", example: "as in measure" },
  ],
  [
    { ipa: "l", grapheme: "L", example: "as in log" },
    { ipa: "ɹ", grapheme: "R", example: "as in ring" },
    { ipa: "w", grapheme: "W", example: "as in win" },
    { ipa: "j", grapheme: "Y", example: "as in yes" },
  ],
  [
    { ipa: "h", grapheme: "H", example: "as in hat" },
    { ipa: "tʃ", grapheme: "CH", example: "as in chin" },
    { ipa: "dʒ", grapheme: "J", example: "as in jam" },
    null,
  ],
  [
    { ipa: "iː", grapheme: "EE", example: "as in street" },
    { ipa: "ɪ", grapheme: "I", example: "as in bid" },
    { ipa: "e", grapheme: "E", example: "as in bed" },
    { ipa: "eː", grapheme: "AIR", example: "as in share" },
  ],
  [
    { ipa: "æ", grapheme: "A", example: "as in bad" },
    { ipa: "ɐ", grapheme: "U", example: "as in bud" },
    { ipa: "ɐː", grapheme: "AR", example: "as in bark" },
    { ipa: "ɜː", grapheme: "ER", example: "as in bird" },
  ],
  [
    { ipa: "ʉː", grapheme: "OO", example: "as in boot" },
    { ipa: "ɔ", grapheme: "O", example: "as in log" },
    { ipa: "oː", grapheme: "OR", example: "as in fork" },
    { ipa: "ʊ", grapheme: "OO", example: "as in book" },
  ],
  [
    { ipa: "æɪ", grapheme: "AY", example: "as in bait" },
    { ipa: "ɑe", grapheme: "IE", example: "as in bike" },
    { ipa: "oɪ", grapheme: "OY", example: "as in boil" },
    { ipa: "əʉ", grapheme: "OH", example: "as in boat" },
  ],
  [
    { ipa: "æɔ", grapheme: "OW", example: "as in cloud" },
    { ipa: "ɪə", grapheme: "EAR", example: "as in beard" },
    null,
    { ipa: "ə", grapheme: "UH", example: "as in about" },
  ],
];

/** Flat inventory of every phoneme key (blanks excluded), in keyboard order. */
export const HCE_PHONEME_INVENTORY: Phoneme[] = HCE_KEYBOARD_ROWS.flat().filter(
  (slot): slot is Phoneme => slot !== null,
);

export function phonemeByIpa(ipa: string): Phoneme {
  const match = HCE_PHONEME_INVENTORY.find((phoneme) => phoneme.ipa === ipa);
  if (!match) {
    throw new Error(`Unknown HCE phoneme: ${ipa}`);
  }
  return match;
}

/** Resolve IPA strings against the HCE inventory, preserving order. */
export function resolveHcePhonemes(ipaSequence: string[]): Phoneme[] {
  return ipaSequence.map(phonemeByIpa);
}
