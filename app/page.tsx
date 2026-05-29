import { redirect } from "next/navigation";
import { getLandingFeed } from "@/actions/landing";
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

  const [feed, prayerRequests, mapSummary, geoPosts] = await Promise.all([
    getLandingFeed(28),
    getHomepagePrayerRequests(3),
    getMapSummary(),
    getRecentGeoPosts(10),
  ]);
  return (
    <LandingHome
      displayFontClassName={btwDisplayFont}
      feed={feed}
      isAuthenticated={false}
      prayerRequests={prayerRequests}
      mapSummary={mapSummary}
      geoPosts={geoPosts}
    />
  );
}
