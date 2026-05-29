import Link from "next/link";
import { BtwLogo } from "@/components/btw-logo";
import {
  bibleQaPoweredByLine,
  footerLegalLinks,
  footerNavLinks,
  siteFooterTagline,
} from "@/lib/site-links";
import { cn } from "@/lib/utils";

const footerLinkClass =
  "text-sm text-muted-foreground transition-colors hover:text-foreground";

export function SiteFooter({ className }: { className?: string }) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "mt-10 sm:mt-14 border-t border-border bg-muted/35 dark:bg-muted/15",
        className
      )}
    >
      <div className="container mx-auto max-w-6xl px-4 sm:px-5 py-10 sm:py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-2">
            <BtwLogo href="/" className="max-w-[12rem]" />
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              {siteFooterTagline}
            </p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              {bibleQaPoweredByLine}
            </p>
          </div>

          <nav aria-label="Site">
            <p className="btw-overline mb-3">Site</p>
            <ul className="space-y-2.5">
              {footerNavLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className={footerLinkClass}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal">
            <p className="btw-overline mb-3">Legal</p>
            <ul className="space-y-2.5">
              {footerLegalLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className={footerLinkClass}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <p className="btw-meta mt-10 border-t border-border/80 pt-6">
          © {year} Believe The Works. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
