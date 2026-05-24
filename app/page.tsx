import { getLandingFeed } from "@/actions/landing";
import { LandingHome } from "@/components/landing-home";

export default async function Home() {
  const feed = await getLandingFeed(28);
  return (
    <LandingHome
      displayFontClassName="font-[family-name:var(--font-landing-display)]"
      feed={feed}
    />
  );
}
