import { getLandingHomeData, getLandingFeed, getLandingRecentChannels } from "@/actions/landing";
import { LandingHome } from "@/components/landing-home";

export default async function Home() {
  const [{ intro }, feed, recentChannels] = await Promise.all([
    getLandingHomeData(),
    getLandingFeed(28),
    getLandingRecentChannels(14),
  ]);
  return (
    <LandingHome
      displayFontClassName="font-[family-name:var(--font-landing-display)]"
      intro={intro}
      feed={feed}
      recentChannels={recentChannels}
    />
  );
}
