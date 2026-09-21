"use client";

import { useState } from "react";
import { CorpusWordManager } from "@/components/shared/CorpusWordManager";
import type { Phoneme, PhonemeWord } from "@/lib/phoneme-types";

export function WordBankPageClient({
  initialCorpus,
  inventory,
}: {
  initialCorpus: PhonemeWord[];
  inventory: Phoneme[];
}) {
  const [corpus, setCorpus] = useState(initialCorpus);

  return (
    <CorpusWordManager
      corpus={corpus}
      inventory={inventory}
      onCorpusChange={(next) => setCorpus(next)}
      variant="page"
    />
  );
}
