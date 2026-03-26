import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

type LandingHomeProps = {
  displayFontClassName: string;
};

export function LandingHome({ displayFontClassName }: LandingHomeProps) {
  return (
    <article className="-mt-6 sm:-mt-10">
      {/* Hero — immersive, museum-like */}
      <FullBleed>
        <section
          className="relative min-h-[min(88vh,52rem)] flex flex-col justify-end"
          aria-labelledby="landing-hero-heading"
        >
          <Image
            src="https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=1920&q=85"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/25"
            aria-hidden
          />
          <div className="relative z-10 container mx-auto max-w-6xl px-4 sm:px-5 pb-16 sm:pb-20 md:pb-24 pt-32">
            <p className="text-white/80 text-xs sm:text-sm font-medium tracking-[0.2em] uppercase mb-3">
              Believe The Works
            </p>
            <h1
              id="landing-hero-heading"
              className={cn(
                displayFontClassName,
                "text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal tracking-tight max-w-4xl leading-[1.08] text-balance"
              )}
            >
              Testify boldly in a space guarded by grace
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-white/85 max-w-2xl leading-relaxed text-pretty">
              Explore channels of video, podcasts, articles, and discussion—built for encouragement and faith.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center">
              <Button
                asChild
                size="lg"
                className="min-h-12 rounded-full px-8 bg-white text-foreground hover:bg-white/90"
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
                className="min-h-12 rounded-full px-8 border-white/40 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
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

      {/* Intro strip */}
      <section className="py-14 sm:py-18 md:py-20 border-b border-border/60">
        <div className="max-w-3xl">
          <p className={cn(displayFontClassName, "text-2xl sm:text-3xl md:text-4xl text-foreground leading-snug text-pretty")}>
            A calm place to discover, share, and grow—moderated for safety, designed for depth.
          </p>
          <p className="mt-6 text-muted-foreground text-base sm:text-lg leading-relaxed">
            Mock layout: replace this strip with featured channels or editorial copy from your CMS later.
          </p>
        </div>
      </section>

      {/* Featured large cards */}
      <section className="py-14 sm:py-16 md:py-20" aria-labelledby="landing-featured-heading">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 md:mb-12">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {FEATURED.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group relative aspect-[3/4] md:aspect-[4/5] overflow-hidden rounded-2xl border border-border/50 bg-muted shadow-sm transition-transform duration-300 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Image
                src={item.image}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-105"
              />
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-t opacity-90",
                  item.accent
                )}
                aria-hidden
              />
              <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-7 text-white">
                <p className="text-xs font-medium tracking-wider uppercase text-white/70">{item.subtitle}</p>
                <p className={cn(displayFontClassName, "mt-2 text-2xl sm:text-3xl font-normal leading-tight")}>
                  {item.title}
                </p>
                <span className="mt-4 inline-flex items-center text-sm font-medium opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 motion-reduce:opacity-100 motion-reduce:translate-y-0">
                  Open
                  <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
                </span>
              </div>
            </Link>
          ))}
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
                  "relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 min-h-[9.5rem] flex flex-col justify-between transition-shadow motion-safe:hover:shadow-md",
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
