"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, BookmarkCheck, Brain, Pause, Play, Square } from "lucide-react";
import { saveVerseToMemoryBank, toggleBibleBookmark } from "@/actions/bible-reader";
import { cn } from "@/lib/utils";

type Verse = { verse: number; text: string };

type Props = {
  translationId: string;
  bookAbbrev: string;
  bookTitle: string;
  chapterNumber: number;
  verses: Verse[];
  isAuthenticated: boolean;
  bookmarkedVerses: number[];
  rememberedVerses: number[];
  loginHref: string;
};

type SpeechState = "idle" | "playing" | "paused";

export function BibleReader({
  translationId,
  bookAbbrev,
  bookTitle,
  chapterNumber,
  verses,
  isAuthenticated,
  bookmarkedVerses,
  rememberedVerses,
  loginHref,
}: Props) {
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(() => new Set(bookmarkedVerses));
  const [remembered, setRemembered] = useState(() => new Set(rememberedVerses));
  const [notice, setNotice] = useState<string | null>(null);
  const [speech, setSpeech] = useState<SpeechState>("idle");
  const [spokenVerse, setSpokenVerse] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const stopRef = useRef(false);
  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    setBookmarked(new Set(bookmarkedVerses));
    setRemembered(new Set(rememberedVerses));
  }, [bookmarkedVerses, rememberedVerses]);

  useEffect(() => {
    return () => {
      stopRef.current = true;
      window.speechSynthesis?.cancel();
    };
  }, [bookAbbrev, chapterNumber]);

  function stopReading() {
    stopRef.current = true;
    window.speechSynthesis?.cancel();
    setSpeech("idle");
    setSpokenVerse(null);
  }

  function speakFrom(index: number) {
    if (!canSpeak || stopRef.current || index >= verses.length) {
      setSpeech("idle");
      setSpokenVerse(null);
      return;
    }
    const verse = verses[index];
    const utterance = new SpeechSynthesisUtterance(`Verse ${verse.verse}. ${verse.text}`);
    utterance.rate = 0.92;
    const english = window.speechSynthesis
      .getVoices()
      .find((voice) => voice.lang.toLowerCase().startsWith("en"));
    if (english) utterance.voice = english;
    utterance.onend = () => speakFrom(index + 1);
    utterance.onerror = () => {
      setSpeech("idle");
      setSpokenVerse(null);
    };
    setSpokenVerse(verse.verse);
    setSpeech("playing");
    window.speechSynthesis.speak(utterance);
  }

  function listen() {
    if (!canSpeak) {
      setNotice("Audio reading is not available in this browser.");
      return;
    }
    if (speech === "paused") {
      window.speechSynthesis.resume();
      setSpeech("playing");
      return;
    }
    if (speech === "playing") {
      window.speechSynthesis.pause();
      setSpeech("paused");
      return;
    }
    stopRef.current = false;
    window.speechSynthesis.cancel();
    speakFrom(0);
  }

  function requireSignIn() {
    router.push(loginHref);
  }

  function onBookmark(verse: Verse) {
    if (!isAuthenticated) {
      requireSignIn();
      return;
    }
    startTransition(async () => {
      const result = await toggleBibleBookmark({
        translationId,
        bookAbbrev,
        bookTitle,
        chapter: chapterNumber,
        verse: verse.verse,
        verseText: verse.text,
      });
      if ("error" in result) {
        if (result.needsAuth) requireSignIn();
        else setNotice(result.error);
        return;
      }
      setBookmarked((current) => {
        const next = new Set(current);
        if (result.bookmarked) next.add(verse.verse);
        else next.delete(verse.verse);
        return next;
      });
      setNotice(result.bookmarked ? `Bookmarked ${bookTitle} ${chapterNumber}:${verse.verse}` : "Bookmark removed");
    });
  }

  function onRemember(verse: Verse) {
    if (!isAuthenticated) {
      requireSignIn();
      return;
    }
    if (remembered.has(verse.verse)) {
      setNotice(`${bookTitle} ${chapterNumber}:${verse.verse} is already in your scripture memory.`);
      return;
    }
    startTransition(async () => {
      const result = await saveVerseToMemoryBank({
        bookTitle,
        chapter: chapterNumber,
        verse: verse.verse,
        verseText: verse.text,
      });
      if ("error" in result) {
        if (result.needsAuth) requireSignIn();
        else setNotice(result.error);
        return;
      }
      setRemembered((current) => new Set(current).add(verse.verse));
      setNotice(
        result.already
          ? `${bookTitle} ${chapterNumber}:${verse.verse} is already in your scripture memory.`
          : `Added ${bookTitle} ${chapterNumber}:${verse.verse} to your scripture memory.`
      );
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={listen}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted"
        >
          {speech === "playing" ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
          {speech === "playing" ? "Pause" : speech === "paused" ? "Resume" : "Listen"}
        </button>
        {speech !== "idle" ? (
          <button
            type="button"
            onClick={stopReading}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted"
          >
            <Square className="size-3.5" aria-hidden />
            Stop
          </button>
        ) : null}
        <p className="text-xs text-muted-foreground">Audio uses this device&apos;s voice.</p>
      </div>
      {notice ? <p className="mt-3 text-sm text-primary">{notice}</p> : null}
      <ol className="mt-5 space-y-4">
        {verses.map((verse) => {
          const saved = bookmarked.has(verse.verse);
          const inMemory = remembered.has(verse.verse);
          const speaking = spokenVerse === verse.verse;
          return (
            <li
              key={verse.verse}
              id={`v-${verse.verse}`}
              className={cn(
                "rounded-lg px-2 py-1.5 text-base leading-relaxed text-foreground",
                speaking && "bg-primary/10"
              )}
            >
              <sup className="mr-1.5 text-xs font-semibold text-muted-foreground">{verse.verse}</sup>
              {verse.text}
              <span className="mt-1.5 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => onBookmark(verse)}
                  aria-pressed={saved}
                  className="inline-flex min-h-8 items-center gap-1 rounded-full px-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {saved ? <BookmarkCheck className="size-3.5 text-primary" aria-hidden /> : <Bookmark className="size-3.5" aria-hidden />}
                  {saved ? "Bookmarked" : "Bookmark"}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => onRemember(verse)}
                  aria-pressed={inMemory}
                  className="inline-flex min-h-8 items-center gap-1 rounded-full px-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Brain className="size-3.5" aria-hidden />
                  {inMemory ? "In memory" : "Memory bank"}
                </button>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
