import { getLandingFeatured, getLandingFeed } from "@/actions/landing";
import { getPersonalizedHome } from "@/actions/personalized-home";
import { getCurrentUser } from "@/actions";
import { getHomepagePrayerRequests } from "@/actions/prayer";
import { LandingHome } from "@/components/landing-home";
import { PersonalizedHome } from "@/components/personalized-home";
import { btwDisplayFont } from "@/lib/btw-ui";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) {
    const home = await getPersonalizedHome(user.id);
    return <PersonalizedHome data={home} displayFontClassName={btwDisplayFont} />;
  }

  const [feed, featured, prayerRequests] = await Promise.all([
    getLandingFeed(28),
    getLandingFeatured(3),
    getHomepagePrayerRequests(3),
  ]);
  return (
    <LandingHome
      displayFontClassName={btwDisplayFont}
      feed={feed}
      featured={featured}
      isAuthenticated={false}
      prayerRequests={prayerRequests}
    />
  );
}
