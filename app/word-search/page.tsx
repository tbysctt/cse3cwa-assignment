import { listWords, listPhonemeInventory } from "@/dal";
import { WordSearchBuilder } from "@/components/word-search/WordSearchBuilder";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Word Search",
};

export default async function WordSearchPage() {
  const [inventory, words] = await Promise.all([
    listPhonemeInventory(),
    listWords(),
  ]);

  return (
    <div className="flex flex-col gap-(--section-gap)">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">
          Phoneme Word Search
        </h1>
        <p className="mt-2 max-w-2xl text-absent">
          Build a phoneme-based word search from a small word list. Edit the
          words, preview the generated grid, then download a single playable
          HTML file.
        </p>
      </header>
      <WordSearchBuilder inventory={inventory} words={words} />
    </div>
  );
}
