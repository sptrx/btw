/** Curated starter questions for seekers — plain language, no insider jargon. */

export type OutreachQuestion = {
  id: string;
  label: string;
  /** Prefill for /ask */
  prompt: string;
};

export const OUTREACH_COMMON_QUESTIONS: OutreachQuestion[] = [
  {
    id: "who-is-jesus",
    label: "Who is Jesus?",
    prompt: "Who is Jesus, and why do Christians believe he matters?",
  },
  {
    id: "bible-real",
    label: "Is the Bible real?",
    prompt: "How do Christians understand whether the Bible is reliable or historical?",
  },
  {
    id: "resurrection",
    label: "Why believe in the resurrection?",
    prompt: "Why do Christians believe Jesus rose from the dead?",
  },
  {
    id: "suffering",
    label: "Why is there suffering?",
    prompt: "If God is good, why is there so much suffering in the world?",
  },
  {
    id: "prayer",
    label: "Does prayer work?",
    prompt: "What does the Bible teach about prayer, and does God hear and answer prayer?",
  },
  {
    id: "start",
    label: "Where do I start?",
    prompt: "I am curious about Christianity but do not know where to start. What would you suggest?",
  },
];
