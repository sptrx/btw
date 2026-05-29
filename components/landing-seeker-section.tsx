import Link from "next/link";
import { BookOpen, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  displayFontClassName: string;
};

/** Outreach hero for visitors exploring faith — sits below the believer-focused hero. */
export function LandingSeekerSection({ displayFontClassName }: Props) {
  return (
    <section
      className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen max-w-none border-y border-amber-200/50 bg-gradient-to-b from-amber-50/90 via-amber-50/40 to-background dark:border-amber-900/40 dark:from-amber-950/35 dark:via-amber-950/15 dark:to-background"
      aria-labelledby="landing-seeker-heading"
    >
      <div className="container mx-auto max-w-6xl px-4 py-12 sm:px-5 sm:py-14 md:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/50 bg-amber-100/60 px-3 py-1 text-xs font-medium text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/50 dark:text-amber-100">
            <Sparkles className="size-3.5" aria-hidden />
            Exploring faith?
          </p>
          <h2
            id="landing-seeker-heading"
            className={cn(
              displayFontClassName,
              "mt-5 text-balance text-2xl font-normal tracking-tight sm:text-3xl md:text-4xl",
            )}
          >
            Curious about faith? You&apos;re welcome here.
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Ask any question about the Bible, read real stories of transformed lives, or just
            explore — no pressure, no commitment.
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="rounded-full min-h-11">
              <Link href="/ask">
                <MessageCircle className="mr-2 size-4" aria-hidden />
                Ask a Bible question
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full min-h-11">
              <Link href="/feed?filter=testimonies">
                <BookOpen className="mr-2 size-4" aria-hidden />
                Read testimonies
              </Link>
            </Button>
          </div>
          <p className="mt-5 text-sm text-muted-foreground">
            <Link href="/explore" className="font-medium text-primary hover:underline">
              Visit our Explore page
            </Link>{" "}
            for stories, common questions, and more.
          </p>
        </div>
      </div>
    </section>
  );
}
