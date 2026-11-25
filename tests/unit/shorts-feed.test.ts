import { describe, expect, it } from "vitest";
import { shortsInFeedFilter } from "@/lib/shorts-types";
import {
  FOR_YOU_CATEGORY_FILTERS,
  SHARING_FEED_FILTERS,
  sharingTypeBadgeClass,
  sharingTypeLabel,
} from "@/lib/sharing-types";

describe("shortsInFeedFilter", () => {
  it("mixes shorts into the broad feeds", () => {
    for (const f of ["all", "for_you", "following", "videos", "shorts"]) {
      expect(shortsInFeedFilter(f)).toBe(true);
    }
  });

  it("leaves shorts out of written-post categories", () => {
    for (const f of ["testimonies", "revelations", "prophecies", "questions", "devotionals", "praise", "prayer", "discussions"]) {
      expect(shortsInFeedFilter(f)).toBe(false);
    }
  });
});

describe("shorts as a feed category", () => {
  it("is offered as a filter and a For you chip", () => {
    expect(SHARING_FEED_FILTERS.map((f) => f.id)).toContain("shorts");
    expect(FOR_YOU_CATEGORY_FILTERS.map((f) => f.id)).toContain("shorts");
  });

  it("has its own badge, distinct from the generic fallback", () => {
    expect(sharingTypeLabel("short")).toBe("Short");
    expect(sharingTypeBadgeClass("short")).not.toBe(sharingTypeBadgeClass("something-else"));
    expect(sharingTypeBadgeClass("short")).toMatch(/dark:/);
  });
});
