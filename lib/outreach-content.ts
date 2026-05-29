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
    prompt: "What is Christian prayer, and do Christians believe it actually works?",
  },
  {
    id: "start",
    label: "Where do I start?",
    prompt: "I am curious about Christianity but do not know where to start. What would you suggest?",
  },
];

export type OutreachRegionCard = {
  id: string;
  label: string;
  description: string;
  /** Placeholder until geo-tagging exists — filtered testimony feed */
  href: string;
};

export const OUTREACH_REGION_CARDS: OutreachRegionCard[] = [
  {
    id: "africa",
    label: "Africa",
    description: "Stories of faith from across the continent",
    href: "/feed?filter=testimonies&region=africa",
  },
  {
    id: "asia",
    label: "Asia & Pacific",
    description: "Voices from diverse cultures and languages",
    href: "/feed?filter=testimonies&region=asia",
  },
  {
    id: "americas",
    label: "Americas",
    description: "North, Central, and South America",
    href: "/feed?filter=testimonies&region=americas",
  },
  {
    id: "europe",
    label: "Europe",
    description: "Testimonies from European communities",
    href: "/feed?filter=testimonies&region=europe",
  },
  {
    id: "oceania",
    label: "Oceania",
    description: "Australia, New Zealand, and the Pacific islands",
    href: "/feed?filter=testimonies&region=oceania",
  },
  {
    id: "middle_east",
    label: "Middle East",
    description: "Faith stories from the region",
    href: "/feed?filter=testimonies&region=middle_east",
  },
  {
    id: "global",
    label: "Everywhere",
    description: "Explore the world map of community posts",
    href: "/map",
  },
];
