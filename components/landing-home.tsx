import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LandingFeaturedCard, LandingIntroCopy } from "@/actions/landing";
import { FeaturedChannelCarousel } from "@/components/featured-channel-carousel";

/** Break out of layout `main` container to full viewport width */
function FullBleed({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen max-w-none",
        className
      )}
    >
      {children}
    </div>
  );
}

const FEATURED = [
  {
    title: "Voices of hope",
    subtitle: "Stories from the community",
    href: "/channel",
    image:
      "https://images.unsplash.com/photo-1507692043040-9e896755c0ff?auto=format&fit=crop&w=900&q=80",
    accent: "from-amber-900/80 to-stone-900/90",
  },
  {
    title: "Scripture & study",
    subtitle: "Articles and reflections",
    href: "/channel",
    image:
      "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=900&q=80",
    accent: "from-indigo-950/85 to-slate-950/90",
  },
  {
    title: "Worship & word",
    subtitle: "Video and audio",
    href: "/channel",
    image:
      "https://images.unsplash.com/photo-1519834785169-43387729b212?auto=format&fit=crop&w=900&q=80",
    accent: "from-rose-950/80 to-neutral-950/90",
  },
] as const;

const EXPLORE = [
  { title: "Morning devotion", tag: "Article", tone: "bg-emerald-950/40" },
  { title: "Community prayer", tag: "Discussion", tone: "bg-sky-950/40" },
  { title: "Sunday message", tag: "Video", tone: "bg-violet-950/40" },
  { title: "Faith & culture", tag: "Podcast", tone: "bg-amber-950/40" },
  { title: "Youth channel", tag: "Channel", tone: "bg-teal-950/40" },
  { title: "Testimonies", tag: "Stories", tone: "bg-orange-950/40" },
] as const;

const DEFAULT_INTRO: LandingIntroCopy = {
  headline: "A calm place to discover, share, and grow—moderated for safety, designed for depth.",
  body: "Featured channels can be curated in the database. Run the latest Supabase migration, then add rows to site_home_featured and edit site_home_copy—or sync these tables from your CMS.",
};

type LandingHomeProps = {
  displayFontClassName: string;
  /** From DB / CMS; if empty, mock FEATURED is used */
  featured?: LandingFeaturedCard[];
  /** From site_home_copy; if null, DEFAULT_INTRO is used */
  intro?: LandingIntroCopy | null;
};

export function LandingHome({ displayFontClassName, featured, intro }: LandingHomeProps) {
  const featuredCards = featured && featured.length > 0 ? featured : [...FEATURED];
  const introCopy =
    intro && (intro.headline || intro.body)
      ? {
          headline: intro.headline || DEFAULT_INTRO.headline,
          body: intro.body || "",
        }
      : DEFAULT_INTRO;
  return (
    <article className="-mt-6 sm:-mt-10">
      {/* Hero — compact band so featured channels sit high on the page */}
      <FullBleed>
        <section
          className="relative min-h-0 md:min-h-[min(38vh,22rem)] flex flex-col justify-end"
          aria-labelledby="landing-hero-heading"
        >
          <Image
            src="https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=1920&q=85"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover max-md:object-[50%_35%]"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/50 to-black/30"
            aria-hidden
          />
          <div className="relative z-10 container mx-auto max-w-6xl px-4 sm:px-5 pt-14 pb-6 sm:pt-16 sm:pb-8 md:pt-20 md:pb-9">
            <p className="text-white/80 text-[10px] sm:text-xs font-medium tracking-[0.18em] uppercase mb-1.5 sm:mb-2">
              Believe The Works
            </p>
            <h1
              id="landing-hero-heading"
              className={cn(
                displayFontClassName,
                "text-white text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-normal tracking-tight max-w-3xl leading-[1.12] text-balance"
              )}
            >
              Testify boldly in a space guarded by grace
            </h1>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base text-white/85 max-w-xl leading-snug text-pretty line-clamp-2 sm:line-clamp-none">
              Explore channels of video, podcasts, articles, and discussion—built for encouragement and faith.
            </p>
            <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center">
              <Button
                asChild
                size="lg"
                className="min-h-10 sm:min-h-11 rounded-full px-6 sm:px-8 text-sm sm:text-base bg-white text-foreground hover:bg-white/90"
              >
                <Link href="/auth/signup">
                  Get started
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="min-h-10 sm:min-h-11 rounded-full px-6 sm:px-8 text-sm sm:text-base border-white/40 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
              >
                <Link href="/channel">
                  <Play className="mr-2 h-4 w-4 fill-current" aria-hidden />
                  Browse channels
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </FullBleed>

      {/* Featured large cards — directly under hero */}
      <section className="pt-6 pb-10 sm:pt-8 sm:pb-12 md:pt-10 md:pb-14" aria-labelledby="landing-featured-heading">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4 mb-6 md:mb-8">
          <h2
            id="landing-featured-heading"
            className={cn(displayFontClassName, "text-3xl sm:text-4xl font-normal text-foreground")}
          >
            Featured
          </h2>
          <Link
            href="/channel"
            className="text-sm font-medium text-primary hover:underline underline-offset-4 inline-flex items-center gap-1"
          >
            View all
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <FeaturedChannelCarousel items={featuredCards} displayFontClassName={displayFontClassName} />
      </section>

      {/* Intro strip — below featured so cards stay above the fold */}
      <section className="py-8 sm:py-10 md:py-12 border-b border-border/60">
        <div className="max-w-3xl">
          <p className={cn(displayFontClassName, "text-xl sm:text-2xl md:text-3xl text-foreground leading-snug text-pretty")}>
            {introCopy.headline}
          </p>
          {introCopy.body ? (
            <p className="mt-4 sm:mt-5 text-muted-foreground text-sm sm:text-base leading-relaxed">{introCopy.body}</p>
          ) : null}
        </div>
      </section>

      {/* Explore grid */}
      <FullBleed className="bg-muted/40 dark:bg-muted/20 border-y border-border/60">
        <section className="py-14 sm:py-16 md:py-20 container mx-auto max-w-6xl px-4 sm:px-5">
          <h2
            className={cn(displayFontClassName, "text-3xl sm:text-4xl font-normal text-foreground mb-10 md:mb-12")}
          >
            Explore
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {EXPLORE.map((item) => (
              <div
                key={item.title}
                className={cn(
                  "relative flex min-h-[9.5rem] flex-col justify-between overflow-hidden btw-surface btw-surface-lift p-6",
                  item.tone
                )}
              >
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {item.tag}
                </span>
                <p className={cn(displayFontClassName, "text-xl sm:text-2xl text-foreground mt-4 leading-snug")}>
                  {item.title}
                </p>
                <span className="text-sm text-primary font-medium mt-4 opacity-80">Coming soon</span>
              </div>
            ))}
          </div>
        </section>
      </FullBleed>

      {/* Quote */}
      <section className="py-16 sm:py-20 md:py-24">
        <blockquote
          className={cn(
            displayFontClassName,
            "text-2xl sm:text-3xl md:text-4xl font-normal text-center text-foreground max-w-3xl mx-auto leading-snug text-balance"
          )}
        >
          “They triumphed by the blood of the Lamb and by the word of their testimony.”
        </blockquote>
        <p className="text-center text-sm text-muted-foreground mt-6 tracking-wide">Revelation 12:11</p>
      </section>

      {/* CTA */}
      <FullBleed>
        <section className="bg-primary text-primary-foreground py-14 sm:py-16 md:py-20">
          <div className="container mx-auto max-w-6xl px-4 sm:px-5 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="max-w-xl">
              <h2 className={cn(displayFontClassName, "text-3xl sm:text-4xl font-normal text-balance")}>
                Join the community
              </h2>
              <p className="mt-3 text-primary-foreground/85 text-base sm:text-lg leading-relaxed">
                Sign up to comment, share, and follow channels you care about.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="min-h-12 rounded-full px-8 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                <Link href="/auth/signup">Create account</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="min-h-12 rounded-full px-8 border-primary-foreground/40 text-primary-foreground bg-transparent hover:bg-primary-foreground/10"
              >
                <Link href="/auth/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </section>
      </FullBleed>
    </article>
  );
}
