import { student } from "@/lib/student";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <div className="mx-auto flex flex-col gap-(--section-gap)">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">About</h1>
        <p className="mt-2 text-absent">
          The CSE3CWA assignment by {student.name} ({student.studentNumber})
        </p>
      </header>

      <section className="ui-surface space-y-4 p-5">
        <h2 className="text-xl font-semibold">What this project is</h2>
        <p className="leading-relaxed text-foreground/90">
          The Phoneme Activity Builder helps teachers and Speech Pathology
          students prepare classroom activities that emphasise phoneme awareness
          rather than plain spelling drills. Teachers configure an activity in
          this web app, preview how it plays, and download a single HTML file
          for use in any normal browser — including offline classroom machines.
        </p>
        <p className="leading-relaxed text-foreground/90">
          <strong>Assessment 2 adds database persistence.</strong> Teachers can
          save, load, update, and delete named Wordle and Word Search
          configurations in PostgreSQL — including phoneme-based word lists and
          activity settings — then generate downloadable HTML from that stored
          data rather than only temporary frontend values.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <article className="ui-surface p-5">
          <h2 className="text-lg font-semibold">Phoneme Wordle tool</h2>
          <p className="mt-2 text-sm leading-relaxed text-absent">
            Builds a Wordle-style activity from the HCE phoneme corpus. Teachers
            choose a 3-, 4-, or 5-phoneme word; players guess IPA sequences with
            colour and pattern feedback, and hover hints map symbols such as /θ/
            to letter patterns like TH (as in thin).
          </p>
        </article>
        <article className="ui-surface p-5">
          <h2 className="text-lg font-semibold">Phoneme Word Search tool</h2>
          <p className="mt-2 text-sm leading-relaxed text-absent">
            Generates a word search from five HCE corpus words chosen by the
            teacher. Learners select matching sequences in the grid and reveal
            the English spelling of each word once found.
          </p>
        </article>
      </section>

      <section className="ui-surface p-5">
        <h2 className="text-xl font-semibold">Guide</h2>
        <p className="mt-2 text-sm text-absent">
          A walkthrough of the code, commits and functionality of the activity
          builder.
        </p>
        <div className="mt-4 aspect-video overflow-hidden rounded-(--control-radius) border border-border bg-surface-muted">
          <video
            className="h-full w-full"
            controls
            preload="metadata"
            aria-label="How to use the Phoneme Activity Builder"
          >
            <source src="/guide.mp4" type="video/mp4" />
            Your browser does not support the video tag. Add{" "}
            <code>public/guide.mp4</code> or embed an external video here.
          </video>
        </div>
      </section>
    </div>
  );
}
