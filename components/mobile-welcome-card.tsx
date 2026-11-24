"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "btw-welcome-dismissed";

/** Short, dismissible pitch above the feed for signed-out visitors. */
export function MobileWelcomeCard() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") setHidden(true);
    } catch {
      /* storage unavailable: just show the card */
    }
  }, []);

  if (hidden) return null;

  const dismiss = () => {
    setHidden(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <section
      aria-label="Welcome"
      className="relative mb-3 rounded-xl border border-border/70 bg-card p-4 shadow-sm"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss welcome message"
        className="absolute right-1.5 top-1.5 inline-flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <X className="size-4" aria-hidden />
      </button>
      <h2 className="pr-10 text-lg font-semibold leading-snug text-foreground">
        Share your witness. Strengthen another.
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        A faith community for testimonies, prayer and encouragement. Everything is checked by AI
        moderation, so it is safe for every age. Use Sign up above to join.
      </p>
    </section>
  );
}
