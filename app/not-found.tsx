import Link from "next/link";
import { btwDisplayFont } from "@/lib/btw-ui";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-12 text-center sm:py-16">
      <p className="btw-section-eyebrow">Error</p>
      <div className="btw-auth-panel">
        <div
          className={cn(
            btwDisplayFont,
            "text-6xl font-normal tabular-nums text-muted-foreground/80 sm:text-7xl"
          )}
          aria-hidden
        >
          404
        </div>
        <h1 className={cn(btwDisplayFont, "mt-4 text-2xl font-normal text-foreground sm:text-3xl")}>
          Page not found
        </h1>
        <p className="mt-3 text-sm text-muted-foreground text-pretty">
          The link may be broken or the page was removed. You can head home and keep exploring.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground no-underline motion-safe:transition-colors motion-safe:hover:bg-primary/90"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
