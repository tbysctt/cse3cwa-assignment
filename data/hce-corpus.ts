import type { PhonemeWord, PhonemeLength } from "@/lib/phoneme-types";
import { resolveHcePhonemes } from "@/data/hce-keyboard";

export type { PhonemeLength };

function word(
  english: string,
  ...ipaSequence: string[]
): PhonemeWord {
  return {
    id: english,
    english,
    phonemes: resolveHcePhonemes(ipaSequence),
  };
}

/** 30 HCE words with exactly 3 phonemes. */
export const HCE_WORDS_3: PhonemeWord[] = [
  word("bed", "b", "e", "d"),
  word("bid", "b", "ɪ", "d"),
  word("bad", "b", "æ", "d"),
  word("bud", "b", "ɐ", "d"),
  word("bird", "b", "ɜː", "d"),
  word("bark", "b", "ɐː", "k"),
  word("book", "b", "ʊ", "k"),
  word("boot", "b", "ʉː", "t"),
  word("boat", "b", "əʉ", "t"),
  word("bike", "b", "ɑe", "k"),
  word("bait", "b", "æɪ", "t"),
  word("boil", "b", "oɪ", "l"),
  word("beard", "b", "ɪə", "d"),
  word("choice", "tʃ", "oɪ", "s"),
  word("thin", "θ", "ɪ", "n"),
  word("then", "ð", "e", "n"),
  word("ship", "ʃ", "ɪ", "p"),
  word("chin", "tʃ", "ɪ", "n"),
  word("jam", "dʒ", "æ", "m"),
  word("yes", "j", "e", "s"),
  word("win", "w", "ɪ", "n"),
  word("ring", "ɹ", "ɪ", "ŋ"),
  word("log", "l", "ɔ", "ɡ"),
  word("fan", "f", "æ", "n"),
  word("van", "v", "æ", "n"),
  word("sun", "s", "ɐ", "n"),
  word("zip", "z", "ɪ", "p"),
  word("gum", "ɡ", "ɐ", "m"),
  word("hat", "h", "æ", "t"),
  word("fork", "f", "oː", "k"),
];

/** 30 HCE words with exactly 4 phonemes. */
export const HCE_WORDS_4: PhonemeWord[] = [
  word("stop", "s", "t", "ɔ", "p"),
  word("frog", "f", "ɹ", "ɔ", "ɡ"),
  word("clap", "k", "l", "æ", "p"),
  word("slip", "s", "l", "ɪ", "p"),
  word("drum", "d", "ɹ", "ɐ", "m"),
  word("grin", "ɡ", "ɹ", "ɪ", "n"),
  word("train", "t", "ɹ", "æɪ", "n"),
  word("cloud", "k", "l", "æɔ", "d"),
  word("snake", "s", "n", "æɪ", "k"),
  word("smile", "s", "m", "ɑe", "l"),
  word("milk", "m", "ɪ", "l", "k"),
  word("hand", "h", "æ", "n", "d"),
  word("tent", "t", "e", "n", "t"),
  word("jump", "dʒ", "ɐ", "m", "p"),
  word("lamp", "l", "æ", "m", "p"),
  word("bank", "b", "æ", "ŋ", "k"),
  word("frame", "f", "ɹ", "æɪ", "m"),
  word("cold", "k", "əʉ", "l", "d"),
  word("wind", "w", "ɪ", "n", "d"),
  word("soft", "s", "ɔ", "f", "t"),
  word("gift", "ɡ", "ɪ", "f", "t"),
  word("desk", "d", "e", "s", "k"),
  word("left", "l", "e", "f", "t"),
  word("pond", "p", "ɔ", "n", "d"),
  word("golf", "ɡ", "ɔ", "l", "f"),
  word("silk", "s", "ɪ", "l", "k"),
  word("great", "ɡ", "ɹ", "æɪ", "t"),
  word("crab", "k", "ɹ", "æ", "b"),
  word("plug", "p", "l", "ɐ", "ɡ"),
  word("quiz", "k", "w", "ɪ", "z"),
];

/** 30 HCE words with exactly 5 phonemes. */
export const HCE_WORDS_5: PhonemeWord[] = [
  word("stamp", "s", "t", "æ", "m", "p"),
  word("plant", "p", "l", "æ", "n", "t"),
  word("blank", "b", "l", "æ", "ŋ", "k"),
  word("grand", "ɡ", "ɹ", "æ", "n", "d"),
  word("clamp", "k", "l", "æ", "m", "p"),
  word("twist", "t", "w", "ɪ", "s", "t"),
  word("trust", "t", "ɹ", "ɐ", "s", "t"),
  word("drink", "d", "ɹ", "ɪ", "ŋ", "k"),
  word("brisk", "b", "ɹ", "ɪ", "s", "k"),
  word("shrimp", "ʃ", "ɹ", "ɪ", "m", "p"),
  word("scrap", "s", "k", "ɹ", "æ", "p"),
  word("scribe", "s", "k", "ɹ", "ɑe", "b"),
  word("scream", "s", "k", "ɹ", "iː", "m"),
  word("splash", "s", "p", "l", "æ", "ʃ"),
  word("spring", "s", "p", "ɹ", "ɪ", "ŋ"),
  word("strap", "s", "t", "ɹ", "æ", "p"),
  word("street", "s", "t", "ɹ", "iː", "t"),
  word("scrub", "s", "k", "ɹ", "ɐ", "b"),
  word("flask", "f", "l", "ɐː", "s", "k"),
  word("clasp", "k", "l", "ɐː", "s", "p"),
  word("cleft", "k", "l", "e", "f", "t"),
  word("glint", "ɡ", "l", "ɪ", "n", "t"),
  word("blend", "b", "l", "e", "n", "d"),
  word("strain", "s", "t", "ɹ", "æɪ", "n"),
  word("thrust", "θ", "ɹ", "ɐ", "s", "t"),
  word("sprawl", "s", "p", "ɹ", "oː", "l"),
  word("scrawl", "s", "k", "ɹ", "oː", "l"),
  word("sprig", "s", "p", "ɹ", "ɪ", "ɡ"),
  word("sprout", "s", "p", "ɹ", "æɔ", "t"),
  word("smoked", "s", "m", "əʉ", "k", "t"),
];

export const HCE_CORPUS_BY_LENGTH: Record<PhonemeLength, PhonemeWord[]> = {
  3: HCE_WORDS_3,
  4: HCE_WORDS_4,
  5: HCE_WORDS_5,
};

/** All 90 HCE corpus words in length order (3, then 4, then 5). */
export const HCE_CORPUS: PhonemeWord[] = [
  ...HCE_WORDS_3,
  ...HCE_WORDS_4,
  ...HCE_WORDS_5,
];

export const PHONEME_LENGTHS: PhonemeLength[] = [3, 4, 5];

export function wordsForLength(length: PhonemeLength): PhonemeWord[] {
  return HCE_CORPUS_BY_LENGTH[length];
}

export function findCorpusWord(id: string): PhonemeWord | undefined {
  return HCE_CORPUS.find((entry) => entry.id === id);
}

export function isPhonemeLength(value: number): value is PhonemeLength {
  return value === 3 || value === 4 || value === 5;
}
