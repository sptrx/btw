import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Play, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LandingChannelPill, LandingFeedItem, LandingIntroCopy } from "@/actions/landing";
import { LandingPublicFeed } from "@/components/landing-public-feed";

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

const DEFAULT_INTRO: LandingIntroCopy = {
  headline: "A calm place to discover, share, and grow—moderated for safety, designed for depth.",
  body: "You can edit this intro in Supabase (`site_home_copy`) or sync it from your CMS.",
};

type LandingHomeProps = {
  displayFontClassName: string;
  /** From site_home_copy; if null, DEFAULT_INTRO is used */
  intro?: LandingIntroCopy | null;
  /** Recent posts for the public feed */
  feed?: LandingFeedItem[];
  /** Author-flagged posts surfaced above the main feed */
  featured?: LandingFeedItem[];
  /** Recent channels for the horizontal strip above the feed */
  recentChannels?: LandingChannelPill[];
};

export function LandingHome({
  displayFontClassName,
  intro,
  feed = [],
  featured = [],
  recentChannels = [],
}: LandingHomeProps) {
  const introCopy =
    intro && (intro.headline || intro.body)
      ? {
          headline: intro.headline || DEFAULT_INTRO.headline,
          body: intro.body || "",
        }
      : DEFAULT_INTRO;
  return (
    <article>
      {/* Hero */}
      <FullBleed>
        <section
          className="relative min-h-[26rem] sm:min-h-[28rem] md:min-h-[min(44vh,26rem)] flex flex-col justify-end"
          aria-labelledby="landing-hero-heading"
        >
          <Image
            src="/sunrise-hero.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover max-md:object-[50%_35%]"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/65 to-black/35"
            aria-hidden
          />
          <div className="relative z-10 container mx-auto max-w-6xl px-4 sm:px-5 pt-14 pb-6 sm:pt-16 sm:pb-8 md:pt-20 md:pb-9">
            <p className="mb-2 flex items-center gap-2.5 text-[10px] font-medium uppercase tracking-[0.18em] text-amber-200/95 sm:mb-2.5 sm:text-xs [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">
              <span aria-hidden className="h-px w-6 bg-amber-300/85" />
              Believe The Works is a powerful invitation to look at the actions and evidence of Jesus Christ when words alone are hard to accept. Refer: John 10:38
            </p>
            <h1
              id="landing-hero-heading"
              className={cn(
                displayFontClassName,
                "max-w-3xl text-balance text-2xl font-normal leading-[1.12] tracking-tight text-amber-50 sm:text-3xl md:text-4xl lg:text-[2.75rem]",
                "[text-shadow:0_2px_14px_rgba(0,0,0,0.55),0_1px_2px_rgba(0,0,0,0.45)]"
              )}
            >
              Testify boldly in a space guarded by grace
            </h1>
            <p className="mt-2 max-w-2xl text-pretty text-sm leading-snug text-amber-100/95 sm:mt-3 sm:text-base [text-shadow:0_1px_6px_rgba(0,0,0,0.55)]">
              Sign up in a minute, open your own channel, and publish your testimony — through written posts, pages, photos, podcasts, and videos. Your story might be the encouragement someone needs today. Or simply scroll the live feed for daily inspiration from a community walking in faith.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:mt-5 sm:flex-row sm:items-center sm:gap-3">
              <Button
                asChild
                size="lg"
                className="min-h-10 rounded-full bg-amber-50 px-6 text-sm text-neutral-950 hover:bg-amber-50/90 hover:text-neutral-950 sm:min-h-11 sm:px-8 sm:text-base"
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
                className="min-h-10 rounded-full border-amber-200/50 bg-white/10 px-6 text-sm text-amber-50 backdrop-blur-sm hover:bg-white/20 hover:text-amber-50 sm:min-h-11 sm:px-8 sm:text-base"
              >
                <Link href="/channel/browse">
                  <Play className="mr-2 h-4 w-4 fill-current" aria-hidden />
                  Browse channels
                </Link>
              </Button>
            </div>
            <p className="mt-6 inline-flex items-center gap-2 text-sm text-amber-100/85 [text-shadow:0_1px_4px_rgba(0,0,0,0.6)]">
              <ShieldCheck className="size-4" aria-hidden />
              All content reviewed by AI — safe for the whole family
            </p>
          </div>
        </section>
      </FullBleed>

      {/* Intro strip */}
      <section className="py-10 sm:py-12 md:py-14 border-b border-border/60">
        <div className="max-w-3xl">
          <p className="btw-section-eyebrow">Welcome</p>
          <p className={cn(displayFontClassName, "text-xl sm:text-2xl md:text-3xl text-foreground leading-snug text-pretty")}>
            {introCopy.headline}
          </p>
          {introCopy.body ? (
            <p className="mt-4 sm:mt-5 text-muted-foreground text-sm sm:text-base leading-relaxed">{introCopy.body}</p>
          ) : null}
        </div>
      </section>

      {/* Public feed — narrow column like a social timeline */}
      <FullBleed className="bg-muted/35 dark:bg-muted/15 border-y border-border/60">
        <section
          className="py-10 sm:py-12 md:py-14"
          aria-labelledby="landing-feed-heading"
        >
          <div className="container mx-auto max-w-6xl px-4 sm:px-5 mb-6 md:mb-8">
            <h2
              id="landing-feed-heading"
              className={cn(displayFontClassName, "text-3xl sm:text-4xl font-normal text-foreground")}
            >
              Discover
            </h2>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-2xl">
              Embedded and direct video, podcast links, articles, and threads—organized by channel and page.
            </p>
          </div>
          <div className="mx-auto w-full max-w-4xl border-x border-border/50 bg-background shadow-[0_0_0_1px_rgba(0,0,0,0.03)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
            <Suspense fallback={null}>
              <LandingPublicFeed
                displayFontClassName={displayFontClassName}
                feed={feed}
                featured={featured}
                recentChannels={recentChannels}
              />
            </Suspense>
          </div>
        </section>
      </FullBleed>

      {/* Quote — a quiet brand moment */}
      <FullBleed className="bg-muted/30 dark:bg-muted/15 border-y border-border/60">
        <section className="py-16 sm:py-20 md:py-24">
          <div className="container mx-auto max-w-3xl px-4 sm:px-5 text-center">
            <span
              aria-hidden
              className={cn(
                displayFontClassName,
                "block text-7xl sm:text-8xl leading-[0.8] text-primary/20 select-none"
              )}
            >
              &ldquo;
            </span>
            <blockquote
              className={cn(
                displayFontClassName,
                "mt-3 text-2xl sm:text-3xl md:text-4xl font-normal text-foreground leading-snug text-balance"
              )}
            >
              They triumphed by the blood of the Lamb and by the word of their testimony.
            </blockquote>
            <div className="mt-7 flex items-center justify-center gap-3" aria-hidden>
              <span className="h-px w-8 bg-border" />
              <span className="size-1 rounded-full bg-muted-foreground/50" />
              <span className="h-px w-8 bg-border" />
            </div>
            <p className="mt-4 text-xs sm:text-sm text-muted-foreground tracking-[0.16em] uppercase">
              Revelation 12:11
            </p>
          </div>
        </section>
      </FullBleed>

      {/* CTA */}
      <FullBleed>
        <section className="bg-primary text-primary-foreground py-14 sm:py-16 md:py-20">
          <div className="container mx-auto max-w-6xl px-4 sm:px-5 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="max-w-xl">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-primary-foreground/70 sm:text-xs">
                Take the next step
              </p>
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
