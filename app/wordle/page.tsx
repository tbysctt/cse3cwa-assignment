import {
  getKeyboardRows,
  listCorpusWords,
  listPhonemeInventory,
} from "@/dal";
import { WordleBuilder } from "@/components/wordle/WordleBuilder";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wordle",
};

export default async function WordlePage() {
  const [inventory, keyboardRows, corpus] = await Promise.all([
    listPhonemeInventory(),
    getKeyboardRows(),
    listCorpusWords(),
  ]);

  return (
    <div className="flex flex-col gap-(--section-gap)">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Phoneme Wordle</h1>
        <p className="mt-2 max-w-2xl text-absent">
          Create a Wordle-style classroom activity from phoneme symbols.
          Configure the word and settings, preview the playable game, then
          download a single HTML file that runs offline in any browser.
        </p>
      </header>
      <WordleBuilder
        inventory={inventory}
        keyboardRows={keyboardRows}
        corpus={corpus}
      />
    </div>
  );
}
