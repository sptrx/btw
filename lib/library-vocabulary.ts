/** User-facing labels for channel subscription and saved posts. */
export const LIBRARY_LABELS = {
  walkWith: {
    action: "Walk with",
    active: "Walking with",
    section: "Walking with",
    count: (n: number) => (n === 1 ? "1 walking with" : `${n} walking with`),
  },
  keep: {
    action: "Keep",
    active: "Kept",
    section: "Kept posts",
  },
  pageTitle: "Your library",
  pageDescription: "Channels you walk with and posts you keep to revisit.",
} as const;
