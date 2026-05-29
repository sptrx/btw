import Link from "next/link";
import { SHARING_TYPES, SHARING_TYPE_CONFIG, browseTypeHref } from "@/lib/sharing-types";
import { cn } from "@/lib/utils";

/** Platform-wide discovery by post sharing type (links to filtered feed). */
export function BrowseBySharingType({ className }: { className?: string }) {
  return (
    <section className={cn("mb-10", className)} aria-labelledby="browse-by-type-heading">
      <h2 id="browse-by-type-heading" className="btw-section-title mb-1">
        Browse by type
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Find testimonies, questions, devotionals, and more across every channel.
      </p>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4" role="list">
        {SHARING_TYPES.map((type) => {
          const config = SHARING_TYPE_CONFIG[type];
          const Icon = config.icon;
          return (
            <li key={type}>
              <Link
                href={browseTypeHref(type)}
                className={cn(
                  "flex h-full flex-col gap-1 rounded-xl border border-border/80 bg-muted/20 px-3 py-3",
                  "hover:bg-muted/50 hover:border-primary/30 transition-colors"
                )}
              >
                <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  {config.label}
                </span>
                <span className="text-xs text-muted-foreground leading-snug">
                  {config.description}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
