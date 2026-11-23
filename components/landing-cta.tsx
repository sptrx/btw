import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  displayFontClassName: string;
  isAuthenticated?: boolean;
};

/** Full-bleed CTA band on the home page — eyebrow uses primary-foreground only (not btw-overline). */
export function LandingCta({ displayFontClassName, isAuthenticated = false }: Props) {
  return (
    <section
      className="rounded-xl bg-primary px-4 py-8 text-primary-foreground sm:px-5 sm:py-10"
      aria-labelledby="landing-cta-heading"
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-primary-foreground/90 sm:text-xs">
            Take the next step
          </p>
          <h2
            id="landing-cta-heading"
            className={cn(displayFontClassName, "text-3xl sm:text-4xl text-balance")}
          >
            Join the community
          </h2>
          <p className="mt-3 text-base sm:text-lg leading-relaxed text-primary-foreground/90">
            Sign up to comment, share, and follow channels you care about.
          </p>
        </div>
        {!isAuthenticated ? (
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
        ) : (
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="min-h-12 rounded-full px-8 shrink-0 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
          >
            <Link href="/channel/browse">Browse channels</Link>
          </Button>
        )}
      </div>
    </section>
  );
}
