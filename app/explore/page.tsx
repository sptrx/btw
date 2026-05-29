import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Globe2, MessageCircleQuestion, Sparkles } from "lucide-react";
import { getExploreTestimonies } from "@/actions/explore";
import { AnonymousBibleAskForm } from "@/components/anonymous-bible-ask-form";
import { TestimonyPreviewCard } from "@/components/explore/testimony-preview-card";
import { Button } from "@/components/ui/button";
import { btwDisplayFont } from "@/lib/btw-ui";
import {
  OUTREACH_COMMON_QUESTIONS,
  OUTREACH_REGION_CARDS,
} from "@/lib/outreach-content";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Explore faith",
  description:
    "Curious about Christianity? Explore real stories, ask Bible questions, and learn about Believe The Works — no pressure.",
};

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function ExplorePage({ searchParams }: Props) {
  const { q } = await searchParams;
  const initialQuestion = typeof q === "string" ? decodeURIComponent(q) : "";
  const testimonies = await getExploreTestimonies(3);

  return (
    <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen max-w-none">
      {/* Hero */}
      <section className="border-b border-border/60 bg-gradient-to-b from-amber-50/80 to-background dark:from-amber-950/20 dark:to-background">
        <div className="container mx-auto max-w-6xl px-4 py-14 sm:px-5 sm:py-16 md:py-20">
          <p className="btw-section-eyebrow text-amber-800/80 dark:text-amber-200/80">
            Welcome — you belong here
          </p>
          <h1
            className={cn(
              btwDisplayFont,
              "mt-2 max-w-2xl text-balance text-3xl font-normal tracking-tight sm:text-4xl md:text-5xl",
            )}
          >
            Explore faith at your own pace
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Whether you are curious, skeptical, or simply visiting — ask questions, read real-life
            stories, and see what people around the world are sharing. No pressure to believe
            anything today.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full">
              <a href="#ask">Ask a Bible question</a>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <Link href="/feed?filter=testimonies">Read testimonies</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-6xl px-4 py-12 sm:px-5 sm:py-14 space-y-16 md:space-y-20">
        {/* What is BTW */}
        <section aria-labelledby="explore-what-heading" className="max-w-3xl">
          <h2 id="explore-what-heading" className="btw-section-title">
            What is Believe The Works?
          </h2>
          <div className="mt-4 space-y-4 btw-prose">
            <p>
              Believe The Works (BTW) is a welcoming online space where people share honest stories
              about how faith has shaped their lives — and where anyone can ask questions about the
              Bible.
            </p>
            <p>
              We are not here to argue or pressure you. Think of it as a global living room: real
              voices, thoughtful answers, and content moderated so the conversation stays respectful
              and safe.
            </p>
            <p>
              Many visitors come because a friend shared a testimony. Others are simply exploring.
              However you arrived, you are welcome to look around, ask one question, or stay as long
              as you like.
            </p>
          </div>
        </section>

        {/* Featured testimonies */}
        <section aria-labelledby="explore-stories-heading">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="explore-stories-heading" className="btw-section-title">
                Stories of transformed lives
              </h2>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
                Real people sharing what changed for them — in their own words.
              </p>
            </div>
            <Link
              href="/feed?filter=testimonies"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline shrink-0"
            >
              See all testimonies
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          {testimonies.length > 0 ? (
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {testimonies.map((item) => (
                <li key={item.id}>
                  <TestimonyPreviewCard item={item} displayFontClassName={btwDisplayFont} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 btw-empty rounded-xl border border-dashed border-border/80 px-6 py-10 text-center">
              Testimonies will appear here as the community shares.{" "}
              <Link href="/feed?filter=testimonies" className="text-primary hover:underline">
                Browse the feed
              </Link>
            </p>
          )}
        </section>

        {/* Common questions */}
        <section aria-labelledby="explore-questions-heading">
          <h2 id="explore-questions-heading" className="btw-section-title">
            Common questions people ask
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
            Tap a question to try Bible Q&A (powered by xgesis.ai) — thoughtful,
            Scripture-grounded answers without needing an account.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {OUTREACH_COMMON_QUESTIONS.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/ask?q=${encodeURIComponent(item.prompt)}`}
                  className="group flex items-start gap-3 rounded-xl border border-border/70 bg-card px-4 py-3.5 text-sm transition-colors hover:border-primary/40 hover:bg-muted/30"
                >
                  <MessageCircleQuestion
                    className="mt-0.5 size-4 shrink-0 text-primary/80"
                    aria-hidden
                  />
                  <span className="font-medium group-hover:text-primary">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Ask inline */}
        <section
          id="ask"
          aria-labelledby="explore-ask-heading"
          className="scroll-mt-24 rounded-2xl border border-amber-500/25 bg-amber-500/5 px-5 py-8 sm:px-8 sm:py-10"
        >
          <div className="flex items-start gap-3">
            <Sparkles className="size-5 shrink-0 text-amber-700 dark:text-amber-300 mt-0.5" aria-hidden />
            <div className="min-w-0 flex-1">
              <h2 id="explore-ask-heading" className="btw-section-title">
                Ask a Bible question
              </h2>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base max-w-2xl">
                Type anything you have wondered about — who Jesus is, whether the Bible is
                trustworthy, or where to begin. A few questions per hour are free without signing in.
              </p>
              <div className="mt-6 max-w-2xl">
                <AnonymousBibleAskForm initialQuestion={initialQuestion} />
              </div>
            </div>
          </div>
        </section>

        {/* Regions */}
        <section aria-labelledby="explore-regions-heading">
          <h2 id="explore-regions-heading" className="btw-section-title">
            Hear from people around the world
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
            Browse testimonies from different regions, or explore the{" "}
            <Link href="/map" className="font-medium text-primary hover:underline">
              world map
            </Link>
            . Use the region links below to filter testimonies on the community feed.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {OUTREACH_REGION_CARDS.map((region) => (
              <li key={region.id}>
                <Link
                  href={region.href}
                  className="flex h-full flex-col rounded-2xl border border-border/70 bg-card p-5 transition-colors hover:border-primary/35 hover:bg-muted/20"
                >
                  <Globe2 className="size-5 text-primary/80" aria-hidden />
                  <h3 className="mt-3 font-medium">{region.label}</h3>
                  <p className="mt-1 flex-1 text-sm text-muted-foreground">{region.description}</p>
                  <span className="mt-4 text-sm font-medium text-primary">Browse stories →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Sign up CTA */}
        <section
          aria-labelledby="explore-join-heading"
          className="rounded-2xl bg-primary px-6 py-10 text-primary-foreground sm:px-10 sm:py-12"
        >
          <h2 id="explore-join-heading" className={cn(btwDisplayFont, "text-2xl sm:text-3xl font-normal")}>
            Ready when you are
          </h2>
          <p className="mt-3 max-w-xl text-primary-foreground/90 leading-relaxed">
            There is no rush. If you would like to save questions, follow stories, or share your own
            journey someday, a free account takes a minute.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="rounded-full bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            >
              <Link href="/auth/signup">Create free account</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
