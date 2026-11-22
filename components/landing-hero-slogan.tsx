"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Two short lines, sized to sit on one row each in the hero display type. */
export const HERO_SLOGANS = [
  ["Share your witness", "Strengthen another"],
  ["Open your channel", "Publish what you've seen"],
  ["Post a testimony", "Encourage someone today"],
  ["Share a sermon", "Let the Word travel"],
  ["Read the scripture", "Someone is listening"],
  ["Pictures and video", "A witness that remains"],
  ["Start your channel", "Invite others to listen"],
  ["Film what God did", "Share the moment"],
  ["A speech or a sermon", "Strength for a stranger"],
  ["Tell the experience", "Photos, words, or video"],
  ["Your channel is open", "Sermons, stories, scripture"],
  ["Speak it or film it", "Leave a witness behind"],
] as const;

type LandingHeroSloganProps = {
  className?: string;
};

export function LandingHeroSlogan({ className }: LandingHeroSloganProps) {
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(true);

  useEffect(() => {
    const next = Math.floor(Math.random() * HERO_SLOGANS.length);
    if (next === 0) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setIndex(next);
      return;
    }

    setShown(false);
    const timer = window.setTimeout(() => {
      setIndex(next);
      setShown(true);
    }, 280);

    return () => window.clearTimeout(timer);
  }, []);

  const [line1, line2] = HERO_SLOGANS[index];

  return (
    <h1
      id="landing-hero-heading"
      className={cn(
        className,
        "transition-opacity duration-300 motion-reduce:transition-none",
        shown ? "opacity-100" : "opacity-0"
      )}
    >
      <span className="block">{line1}</span>
      <span className="mt-1 block sm:mt-1.5">{line2}</span>
    </h1>
  );
}
