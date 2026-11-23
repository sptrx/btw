import { dailyVerseForDate, type DailyVerse } from "@/lib/daily-verse";

/**
 * Expanded public-domain (KJV) bank for Word of God practice.
 * Daily pick is deterministic from UTC date (+ optional user salt) so everyone
 * gets one stable exercise per day.
 */
const EXTRA_VERSES: DailyVerse[] = [
  {
    reference: "Joshua 1:9",
    text: "Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the Lord thy God is with thee whithersoever thou goest.",
  },
  {
    reference: "Proverbs 3:5–6",
    text: "Trust in the Lord with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.",
  },
  {
    reference: "Isaiah 40:31",
    text: "But they that wait upon the Lord shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.",
  },
  {
    reference: "John 3:16",
    text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
  },
  {
    reference: "Romans 12:2",
    text: "And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God.",
  },
  {
    reference: "Galatians 2:20",
    text: "I am crucified with Christ: nevertheless I live; yet not I, but Christ liveth in me: and the life which I now live in the flesh I live by the faith of the Son of God, who loved me, and gave himself for me.",
  },
  {
    reference: "Ephesians 2:8–9",
    text: "For by grace are ye saved through faith; and that not of yourselves: it is the gift of God: Not of works, lest any man should boast.",
  },
  {
    reference: "Philippians 4:13",
    text: "I can do all things through Christ which strengtheneth me.",
  },
  {
    reference: "Colossians 3:16",
    text: "Let the word of Christ dwell in you richly in all wisdom; teaching and admonishing one another in psalms and hymns and spiritual songs, singing with grace in your hearts to the Lord.",
  },
  {
    reference: "2 Timothy 3:16",
    text: "All scripture is given by inspiration of God, and is profitable for doctrine, for reproof, for correction, for instruction in righteousness.",
  },
  {
    reference: "Hebrews 4:12",
    text: "For the word of God is quick, and powerful, and sharper than any twoedged sword, piercing even to the dividing asunder of soul and spirit, and of the joints and marrow, and is a discerner of the thoughts and intents of the heart.",
  },
  {
    reference: "James 1:22",
    text: "But be ye doers of the word, and not hearers only, deceiving your own selves.",
  },
  {
    reference: "1 Peter 5:7",
    text: "Casting all your care upon him; for he careth for you.",
  },
  {
    reference: "1 John 1:9",
    text: "If we confess our sins, he is faithful and just to forgive us our sins, and to cleanse us from all unrighteousness.",
  },
  {
    reference: "Psalm 119:11",
    text: "Thy word have I hid in mine heart, that I might not sin against thee.",
  },
  {
    reference: "Psalm 119:105",
    text: "Thy word is a lamp unto my feet, and a light unto my path.",
  },
  {
    reference: "Matthew 5:16",
    text: "Let your light so shine before men, that they may see your good works, and glorify your Father which is in heaven.",
  },
  {
    reference: "Matthew 6:33",
    text: "But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.",
  },
  {
    reference: "Mark 12:30",
    text: "And thou shalt love the Lord thy God with all thy heart, and with all thy soul, and with all thy mind, and with all thy strength: this is the first commandment.",
  },
  {
    reference: "John 15:5",
    text: "I am the vine, ye are the branches: He that abideth in me, and I in him, the same bringeth forth much fruit: for without me ye can do nothing.",
  },
];

function bank(): DailyVerse[] {
  // Mix calendar daily verses with the expanded practice bank (dedupe by reference).
  const byRef = new Map<string, DailyVerse>();
  for (let i = 0; i < 400; i++) {
    const d = new Date(Date.UTC(2024, 0, 1 + i));
    const v = dailyVerseForDate(d);
    byRef.set(v.reference, v);
  }
  for (const v of EXTRA_VERSES) byRef.set(v.reference, v);
  return [...byRef.values()];
}

const VERSE_BANK = bank();

function dayIndex(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  return Math.floor(
    (Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - start) /
      86_400_000
  );
}

function hashSalt(salt: string): number {
  let h = 0;
  for (let i = 0; i < salt.length; i++) h = (h * 31 + salt.charCodeAt(i)) >>> 0;
  return h;
}

/** One verse for this UTC day; salt (e.g. user id) rotates the list personally. */
export function wordOfGodForDay(date = new Date(), salt = ""): DailyVerse & { bankSize: number } {
  const idx = (dayIndex(date) + hashSalt(salt)) % VERSE_BANK.length;
  const verse = VERSE_BANK[(idx + VERSE_BANK.length) % VERSE_BANK.length];
  return { ...verse, bankSize: VERSE_BANK.length };
}

/** Loose compare for the practice check (ignore case, punctuation, extra spaces). */
export function normalizeScriptureAnswer(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[^a-z0-9'\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function scripturePracticeMatches(expected: string, attempt: string): boolean {
  const a = normalizeScriptureAnswer(expected);
  const b = normalizeScriptureAnswer(attempt);
  if (!b) return false;
  if (a === b) return true;
  // Allow ~85% token overlap so minor word slips still count as practiced.
  const aTokens = new Set(a.split(" ").filter(Boolean));
  const bTokens = b.split(" ").filter(Boolean);
  if (bTokens.length === 0) return false;
  let hit = 0;
  for (const t of bTokens) if (aTokens.has(t)) hit += 1;
  return hit / Math.max(aTokens.size, bTokens.length) >= 0.85;
}
