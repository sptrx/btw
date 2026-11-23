import { getCurrentUser } from "@/actions";
import { getCommunityFeedPage, type CommunityFeedFilter } from "@/actions/feed";
import { getTodaysWordOfGod } from "@/actions/word-of-god";
import { HomeFeed } from "@/components/feed/home-feed";
import { btwDisplayFont } from "@/lib/btw-ui";

const FEED_FILTERS = new Set<CommunityFeedFilter>([
  "all",
  "following",
  "for_you",
  "testimonies",
  "revelations",
  "prophecies",
  "discussions",
  "questions",
  "devotionals",
  "praise",
  "prayer",
  "videos",
]);

type HomeTab = "for_you" | "following" | "word";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; tab?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const signedIn = Boolean(user);
  const requested = FEED_FILTERS.has(params.filter as CommunityFeedFilter)
    ? (params.filter as CommunityFeedFilter)
    : null;
  const tab: HomeTab = signedIn
    ? params.tab === "following" || params.tab === "word"
      ? params.tab
      : "for_you"
    : "for_you";

  const category =
    requested && requested !== "all" && requested !== "for_you" && requested !== "following"
      ? requested
      : null;

  const feedFilter: CommunityFeedFilter =
    tab === "following" ? "following" : category ?? (signedIn ? "for_you" : "all");

  const [page, word] = await Promise.all([
    tab === "word" ? Promise.resolve(null) : getCommunityFeedPage(feedFilter, 20, null),
    signedIn ? getTodaysWordOfGod() : Promise.resolve(null),
  ]);

  return (
    <HomeFeed
      isAuthenticated={signedIn}
      initialTab={tab}
      initialFilter={feedFilter}
      initialItems={page?.items ?? []}
      initialCursor={page?.nextCursor ?? null}
      word={word}
      displayFontClassName={btwDisplayFont}
    />
  );
}
