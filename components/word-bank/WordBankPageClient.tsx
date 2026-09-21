"use client";

import { useState } from "react";
import { WordBankManager } from "@/components/shared/WordBankManager";
import type { Phoneme, PhonemeWord } from "@/lib/phoneme-types";

export function WordBankPageClient({
  initialWords,
  inventory,
}: {
  initialWords: PhonemeWord[];
  inventory: Phoneme[];
}) {
  const [words, setWords] = useState(initialWords);

  return (
    <WordBankManager
      words={words}
      inventory={inventory}
      onWordsChange={(next) => setWords(next)}
      variant="page"
    />
  );
}
