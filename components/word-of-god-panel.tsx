"use client";

import { useState } from "react";
import Link from "next/link";
import { completeWordOfGodPractice, type WordOfGodToday } from "@/actions/word-of-god";
import { Button } from "@/components/ui/button";

export function WordOfGodPanel({ initial }: { initial: WordOfGodToday }) {
  const [today, setToday] = useState(initial);
  const [phase, setPhase] = useState<"read" | "recall">("read");
  const [attempt, setAttempt] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function practice() {
    setBusy(true);
    setNotice(null);
    const result = await completeWordOfGodPractice(attempt);
    setBusy(false);
    if ("error" in result) {
      setNotice(result.error);
      return;
    }
    setSaved(true);
    setAttempt("");
    setPhase("read");
    setToday((prev) => ({
      ...prev,
      practicedToday: true,
      practiceCount: result.memorized.practiceCount,
    }));
    setNotice("Saved to your library.");
  }

  return (
    <section className="px-4 py-6 sm:px-6" aria-labelledby="word-of-god-heading">
      <h2 id="word-of-god-heading" className="text-xl font-semibold text-foreground">
        Word of God
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        One scripture to memorize today. Practice from memory, then it is kept in your library.
      </p>

      <div className="mt-4 rounded-xl border border-border/70 bg-card p-4 shadow-sm">
        <p className="text-sm font-semibold text-primary">{today.reference}</p>
        {phase === "read" ? (
          <p className="mt-3 text-base leading-relaxed text-foreground">{today.text}</p>
        ) : (
          <p className="mt-3 rounded-lg border border-dashed border-border bg-muted/50 px-3 py-8 text-center text-sm text-muted-foreground">
            Verse hidden. Write it from memory.
          </p>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          {today.practicedToday
            ? `Practiced today · ${today.practiceCount} total`
            : `${today.bankSize} verses in the practice bank`}
        </p>
      </div>

      {phase === "read" ? (
        <Button
          type="button"
          className="mt-4"
          onClick={() => {
            setPhase("recall");
            setAttempt("");
            setNotice(null);
            setSaved(false);
          }}
        >
          I&apos;ve read it. Practice from memory
        </Button>
      ) : (
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void practice();
          }}
        >
          <label htmlFor="word-of-god-attempt" className="block text-sm font-medium">
            Type the verse from memory
          </label>
          <textarea
            id="word-of-god-attempt"
            value={attempt}
            onChange={(event) => setAttempt(event.target.value)}
            rows={5}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            required
          />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy || attempt.trim().length === 0}>
              {busy ? "Saving…" : "Check and save"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setPhase("read")}>
              Show the verse
            </Button>
          </div>
        </form>
      )}

      {notice ? <p className="mt-3 text-sm text-foreground">{notice}</p> : null}
      {saved ? (
        <Link href="/dashboard/library" className="mt-2 inline-flex text-sm font-medium text-primary hover:underline">
          Open library
        </Link>
      ) : null}
    </section>
  );
}
