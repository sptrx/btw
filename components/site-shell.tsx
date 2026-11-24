import { getCurrentUser } from "@/actions";
import { fetchChannels, fetchLatestOwnedChannelSlug } from "@/actions/channels";
import { getHomepagePrayerRequests } from "@/actions/prayer";
import { SiteFrame } from "@/components/site-frame";
import { SiteLeftRail } from "@/components/site-left-rail";
import { SiteRightRail, type PopularChannel, type RailPrayer } from "@/components/site-right-rail";
import { resolveBibleAiNavLink } from "@/lib/bible-ai-config";

export async function SiteShell({ children }: { children: React.ReactNode }) {
  let loggedIn = false;
  let channelSlug: string | null = null;
  let popular: PopularChannel[] = [];
  let prayers: RailPrayer[] = [];
  try {
    const [user, channels, prayerRows] = await Promise.all([
      getCurrentUser(),
      fetchChannels(),
      getHomepagePrayerRequests(4),
    ]);
    loggedIn = Boolean(user);
    channelSlug = user ? await fetchLatestOwnedChannelSlug(user.id) : null;
    prayers = prayerRows.map(({ id, title }) => ({ id, title }));
    popular = [...channels]
      .sort(
        (a, b) => b.follower_count - a.follower_count || b.post_count - a.post_count
      )
      .slice(0, 5)
      .map(({ id, title, slug, follower_count }) => ({
        id,
        title,
        slug,
        follower_count,
      }));
  } catch (error) {
    console.error("[site-shell]", error);
  }

  const bibleQa = resolveBibleAiNavLink(loggedIn);

  return (
    <SiteFrame
      left={<SiteLeftRail isLoggedIn={loggedIn} channelSlug={channelSlug} />}
      right={<SiteRightRail channels={popular} prayers={prayers} bibleQa={bibleQa} />}
    >
      {children}
    </SiteFrame>
  );
}
