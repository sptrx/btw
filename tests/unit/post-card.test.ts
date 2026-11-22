import { describe, expect, it } from "vitest";
import { dailyVerseForDate } from "@/lib/daily-verse";
import { postPoster, readingMinutes } from "@/lib/post-card";

describe("readingMinutes", () => {
  it("hides a label for a short note", () => {
    expect(readingMinutes("God met me there.")).toBeNull();
  });

  it("estimates a longer testimony", () => {
    const words = Array.from({ length: 400 }, () => "grace").join(" ");
    expect(readingMinutes(words)).toBe(2);
  });
});

describe("postPoster", () => {
  it("prefers an uploaded image", () => {
    expect(
      postPoster(
        [
          { url: "https://cdn.example.com/clip.mp4", type: "video/mp4" },
          { url: "https://cdn.example.com/still.jpg", type: "image/jpeg" },
        ],
        { contentType: "video" }
      )
    ).toEqual({ src: "https://cdn.example.com/still.jpg", kind: "image" });
  });

  it("uses a YouTube poster when there is no still", () => {
    expect(
      postPoster([{ url: "https://www.youtube.com/watch?v=abc123XYZ_-", type: "video" }])
    ).toEqual({ src: "https://i.ytimg.com/vi/abc123XYZ_-/hqdefault.jpg", kind: "video" });
  });

  it("falls back to the channel cover for a video", () => {
    expect(
      postPoster([], { contentType: "video", channelCoverUrl: "https://cdn.example.com/cover.png" })
    ).toEqual({ src: "https://cdn.example.com/cover.png", kind: "video" });
  });
});

describe("dailyVerseForDate", () => {
  it("is stable for a given UTC day", () => {
    const a = dailyVerseForDate(new Date("2026-11-21T03:00:00Z"));
    const b = dailyVerseForDate(new Date("2026-11-21T23:00:00Z"));
    expect(a).toEqual(b);
    expect(a.reference.length).toBeGreaterThan(0);
    expect(a.text.length).toBeGreaterThan(20);
  });
});
