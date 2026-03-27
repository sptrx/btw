import { getLandingHomeData } from "@/actions/landing";
import { LandingHome } from "@/components/landing-home";

export default async function Home() {
  const { featured, intro } = await getLandingHomeData();
  return (
    <LandingHome
      displayFontClassName="font-[family-name:var(--font-landing-display)]"
      featured={featured}
      intro={intro}
    />
  );
}
