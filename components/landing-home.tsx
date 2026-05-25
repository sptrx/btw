import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Play, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LandingFeedItem } from "@/actions/landing";
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

type LandingHomeProps = {
  displayFontClassName: string;
  /** Recent posts for the public feed */
  feed?: LandingFeedItem[];
  isAuthenticated?: boolean;
};

export function LandingHome({ displayFontClassName, feed = [], isAuthenticated = false }: LandingHomeProps) {
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
            className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/75 to-black/45"
            aria-hidden
          />
          <div className="relative z-10 container mx-auto max-w-6xl px-4 sm:px-5 pt-14 pb-8 sm:pt-16 sm:pb-10 md:pt-20 md:pb-12">
            <div className="max-w-xl space-y-5 sm:max-w-2xl sm:space-y-6">
              <div className="space-y-2.5 sm:space-y-3">
                
                <p className="max-w-lg text-pretty text-sm leading-relaxed text-amber-100/85 sm:text-base sm:leading-relaxed [text-shadow:0_1px_4px_rgba(0,0,0,0.5)]">
                  An invitation to weigh the actions and evidence of Jesus Christ when words alone are hard to accept. John 10:38
                </p>
              </div>
              <h1
                id="landing-hero-heading"
                className={cn(
                  displayFontClassName,
                  "text-balance text-3xl font-normal leading-[1.18] tracking-tight text-amber-50 sm:text-4xl sm:leading-[1.15] md:text-[2.875rem] lg:text-5xl",
                  "[text-shadow:0_2px_14px_rgba(0,0,0,0.55),0_1px_2px_rgba(0,0,0,0.45)]"
                )}
              >
                <span className="block">Share your witness.</span>
                <span className="mt-1 block sm:mt-1.5">Strengthen another.</span>
              </h1>

              <div className="space-y-3 rounded-r-xl border border-white/10 border-l-[3px] border-l-amber-300/80 bg-black/50 px-4 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:space-y-3.5 sm:px-5 sm:py-5">
                <p className="text-pretty text-base italic leading-relaxed text-amber-50 sm:text-lg sm:leading-relaxed [text-shadow:0_1px_2px_rgba(0,0,0,0.85),0_2px_12px_rgba(0,0,0,0.65)]">
                  As it is written, they overcame by the word of their testimony.
                </p>
                <p className="text-pretty text-sm leading-relaxed text-stone-100 sm:text-[15px] sm:leading-7 md:text-base [text-shadow:0_1px_2px_rgba(0,0,0,0.85),0_2px_12px_rgba(0,0,0,0.65)]">
                Sign up, create your channel, and share your story of what God has done through posts, photos, podcasts, or video. Your testimony could be the encouragement someone needs today.
                </p>
              </div>
            </div>

            <div className="mt-7 flex max-w-xl flex-col gap-2.5 sm:mt-9 sm:max-w-none sm:flex-row sm:items-center sm:gap-3">
              {!isAuthenticated ? (
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
              ) : null}
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
            <p className="mt-7 inline-flex max-w-xl items-center gap-2 text-xs text-amber-100/85 sm:mt-8 sm:text-sm [text-shadow:0_1px_4px_rgba(0,0,0,0.6)]">
              <ShieldCheck className="size-4" aria-hidden />
              All content reviewed by AI — safe for the whole family
            </p>
          </div>
        </section>
      </FullBleed>

      {/* Public feed — single-column timeline */}
      <FullBleed className="bg-muted/35 dark:bg-muted/15 border-y border-border/60">
        <section className="py-10 sm:py-12 md:py-14" aria-labelledby="landing-feed-heading">
          <div className="container mx-auto max-w-6xl px-4 sm:px-5 mb-6 md:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p
              id="landing-feed-heading"
              className="text-sm sm:text-base text-muted-foreground max-w-2xl"
            >
              Latest posts from channels across the community.
            </p>
            <Link
              href="/channel/browse"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline shrink-0"
            >
              Browse channels
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="mx-auto w-full max-w-5xl border-x border-border/50 bg-background shadow-[0_0_0_1px_rgba(0,0,0,0.03)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
            <LandingPublicFeed displayFontClassName={displayFontClassName} feed={feed} />
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
