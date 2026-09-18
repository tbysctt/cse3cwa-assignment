"use client";

import { useEffect, useMemo, useState } from "react";
import type { Phoneme, PhonemeWord } from "@/data/phonemes";
import { phonemeWordDisplay } from "@/data/phonemes";
import { evaluateGuess, isWinningGuess, type GuessResult } from "@/lib/wordle";
import { PhonemeKeyboard } from "./PhonemeKeyboard";
import { WordleGrid, type SubmittedWordleRow } from "./WordleGrid";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export function WordleGame({
  target,
  inventory,
  maxAttempts,
  showHints,
}: {
  target: PhonemeWord;
  inventory: Phoneme[];
  maxAttempts: number;
  showHints: boolean;
}) {
  const length = target.phonemes.length;
  const [current, setCurrent] = useState<Phoneme[]>([]);
  const [submitted, setSubmitted] = useState<SubmittedWordleRow[]>([]);
  const [message, setMessage] = useState("");
  const [messageKind, setMessageKind] = useState<"info" | "win" | "lose">(
    "info",
  );
  const [won, setWon] = useState(false);

  const locked = won || submitted.length >= maxAttempts;

  const targetDisplay = useMemo(() => phonemeWordDisplay(target), [target]);

  function pushPhoneme(phoneme: Phoneme) {
    if (locked || current.length >= length) return;
    setCurrent((prev) => [...prev, phoneme]);
    setMessage("");
    setMessageKind("info");
  }

  function deletePhoneme() {
    if (locked || current.length === 0) return;
    setCurrent((prev) => prev.slice(0, -1));
  }

  function submitGuess() {
    if (locked) return;
    if (current.length < length) {
      setMessage("Fill every phoneme slot before submitting.");
      setMessageKind("info");
      return;
    }
    const result: GuessResult = evaluateGuess(current, target);
    const next = [...submitted, { guess: current, result }];
    setSubmitted(next);
    setCurrent([]);
    if (isWinningGuess(result)) {
      setWon(true);
      setMessageKind("win");
      setMessage(`Correct — ${targetDisplay} = ${target.english}`);
      return;
    }
    if (next.length >= maxAttempts) {
      setMessageKind("lose");
      setMessage(
        `Out of attempts. Answer: ${targetDisplay} (${target.english})`,
      );
    } else {
      setMessage("");
      setMessageKind("info");
    }
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) return;
      if (event.key === "Enter") {
        event.preventDefault();
        submitGuess();
      } else if (event.key === "Backspace") {
        event.preventDefault();
        deletePhoneme();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, submitted, locked, length, maxAttempts, target, targetDisplay]);

  return (
    <div>
      <div className="text-center">
        <h3 className="text-xl font-bold uppercase tracking-[0.08em] text-foreground">
          PHONEME&apos;LE
        </h3>
        <div
          className="mt-3 inline-flex flex-wrap justify-center gap-2 text-xs text-absent"
          aria-label="Activity settings"
        >
          <span className="ui-chip">{maxAttempts} guesses</span>
          <span className="ui-chip">{length} phonemes</span>
        </div>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)] lg:items-start">
        <div className="min-w-0">
          <WordleGrid
            maxAttempts={maxAttempts}
            length={length}
            submitted={submitted}
            current={current}
            showHint={showHints}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <PhonemeKeyboard
            inventory={inventory}
            showHint={showHints}
            disabled={locked}
            onKeyPress={pushPhoneme}
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="ui-button ui-button-primary flex-1 uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-50"
              onClick={submitGuess}
              disabled={locked}
            >
              Enter
            </button>
            <button
              type="button"
              className="ui-button ui-button-secondary disabled:cursor-not-allowed disabled:opacity-50"
              onClick={deletePhoneme}
              disabled={locked}
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <div
        className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-absent"
        aria-hidden="true"
      >
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-sm border border-correct bg-correct" />
          correct
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-sm border border-present bg-present bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.3)_0_2px,transparent_2px_4px)]" />
          wrong position
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-sm border border-absent bg-absent/40" />
          not present
        </span>
      </div>

      <p
        role="status"
        aria-live="polite"
        className={[
          "mt-4 min-h-10 rounded-(--control-radius) px-3 py-2 text-sm font-semibold",
          messageKind === "win"
            ? "border border-correct/50 bg-correct/10 text-correct"
            : messageKind === "lose"
              ? "border border-danger/50 bg-danger/10 text-danger"
              : "text-foreground",
        ].join(" ")}
      >
        {message}
      </p>
    </div>
  );
}
