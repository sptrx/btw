export type DailyVerse = {
  reference: string;
  text: string;
};

/** Short public-domain lines (KJV). The index is the UTC day of the year. */
const VERSES: DailyVerse[] = [
  {
    reference: "John 10:38",
    text: "Though ye believe not me, believe the works: that ye may know, and believe, that the Father is in me, and I in him.",
  },
  {
    reference: "Revelation 12:11",
    text: "And they overcame him by the blood of the Lamb, and by the word of their testimony.",
  },
  {
    reference: "Psalm 34:8",
    text: "O taste and see that the Lord is good: blessed is the man that trusteth in him.",
  },
  {
    reference: "Isaiah 41:10",
    text: "Fear thou not; for I am with thee: be not dismayed; for I am thy God.",
  },
  {
    reference: "Matthew 11:28",
    text: "Come unto me, all ye that labour and are heavy laden, and I will give you rest.",
  },
  {
    reference: "Philippians 4:6",
    text: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.",
  },
  {
    reference: "Romans 8:28",
    text: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose.",
  },
  {
    reference: "Psalm 46:1",
    text: "God is our refuge and strength, a very present help in trouble.",
  },
  {
    reference: "John 14:27",
    text: "Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you.",
  },
  {
    reference: "Lamentations 3:22–23",
    text: "It is of the Lord's mercies that we are not consumed, because his compassions fail not. They are new every morning.",
  },
  {
    reference: "Hebrews 11:1",
    text: "Now faith is the substance of things hoped for, the evidence of things not seen.",
  },
  {
    reference: "Micah 6:8",
    text: "What doth the Lord require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?",
  },
  {
    reference: "2 Corinthians 12:9",
    text: "My grace is sufficient for thee: for my strength is made perfect in weakness.",
  },
  {
    reference: "Psalm 23:1",
    text: "The Lord is my shepherd; I shall not want.",
  },
];

export function dailyVerseForDate(date: Date): DailyVerse {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const day = Math.floor(
    (Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - start) / 86_400_000
  );
  const index = ((day - 1) % VERSES.length + VERSES.length) % VERSES.length;
  return VERSES[index];
}

export function todaysVerse(now = new Date()): DailyVerse {
  return dailyVerseForDate(now);
}
