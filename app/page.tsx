import { getLandingFeed } from "@/actions/landing";
import { getCurrentUser } from "@/actions";
import { LandingHome } from "@/components/landing-home";

export default async function Home() {
  const [feed, user] = await Promise.all([getLandingFeed(28), getCurrentUser()]);
  return (
    <LandingHome
      displayFontClassName="font-[family-name:var(--font-landing-display)]"
      feed={feed}
      isAuthenticated={!!user}
    />
  );
}
