import { redirect } from "next/navigation";
import { getLandingFeatured, getLandingFeed } from "@/actions/landing";
import { getCurrentUser } from "@/actions";
import { getMapSummary, getRecentGeoPosts } from "@/actions/map";
import { getHomepagePrayerRequests } from "@/actions/prayer";
import { LandingHome } from "@/components/landing-home";
import { btwDisplayFont } from "@/lib/btw-ui";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/feed");
  }

  const [feed, featured, prayerRequests, mapSummary, geoPosts] = await Promise.all([
    getLandingFeed(28),
    getLandingFeatured(3),
    getHomepagePrayerRequests(3),
    getMapSummary(),
    getRecentGeoPosts(10),
  ]);
  return (
    <LandingHome
      displayFontClassName={btwDisplayFont}
      feed={feed}
      featured={featured}
      isAuthenticated={false}
      prayerRequests={prayerRequests}
      mapSummary={mapSummary}
      geoPosts={geoPosts}
    />
  );
}
