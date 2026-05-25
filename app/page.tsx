import { getLandingFeed } from "@/actions/landing";
import { getCurrentUser } from "@/actions";
import { LandingHome } from "@/components/landing-home";
import { btwDisplayFont } from "@/lib/btw-ui";

export default async function Home() {
  const [feed, user] = await Promise.all([getLandingFeed(28), getCurrentUser()]);
  return (
    <LandingHome
      displayFontClassName={btwDisplayFont}
      feed={feed}
      isAuthenticated={!!user}
    />
  );
}
