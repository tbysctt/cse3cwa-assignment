import { listCorpusWords, listPhonemeInventory } from "@/dal";
import { WordBankPageClient } from "@/components/word-bank/WordBankPageClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Word bank",
};

export default async function WordBankPage() {
  const [inventory, corpus] = await Promise.all([
    listPhonemeInventory(),
    listCorpusWords(),
  ]);

  return (
    <div className="flex flex-col gap-(--section-gap)">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Word bank</h1>
        <p className="mt-2 max-w-2xl text-absent">
          Manage the phoneme words stored in the database. Wordle and Word
          Search activities pick targets from this list.
        </p>
      </header>
      <WordBankPageClient initialCorpus={corpus} inventory={inventory} />
    </div>
  );
}
