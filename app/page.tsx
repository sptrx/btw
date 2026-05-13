import {
  getLandingHomeData,
  getLandingFeed,
  getLandingFeatured,
  getLandingRecentChannels,
} from "@/actions/landing";
import { LandingHome } from "@/components/landing-home";

export default async function Home() {
  const [{ intro }, feed, featured, recentChannels] = await Promise.all([
    getLandingHomeData(),
    getLandingFeed(28),
    getLandingFeatured(4),
    getLandingRecentChannels(14),
  ]);
  return (
    <LandingHome
      displayFontClassName="font-[family-name:var(--font-landing-display)]"
      intro={intro}
      feed={feed}
      featured={featured}
      recentChannels={recentChannels}
    />
  );
}
