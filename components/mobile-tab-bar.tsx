"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiteNavIcon } from "@/components/site-nav-icon";
import { isNavActive, type SiteNavItem } from "@/lib/site-nav";
import { cn } from "@/lib/utils";

const TAB_KEYS = ["home", "channels", "prayer", "bible", "ask"] as const;
const SHORT_LABEL: Record<string, string> = { prayer: "Prayer", ask: "Ask" };

/** Bottom tab bar for phones and tablets (the left sidebar takes over on large screens). */
export function MobileTabBar({ items }: { items: SiteNavItem[] }) {
  const pathname = usePathname();
  const tabs = TAB_KEYS.map((key) => items.find((i) => i.key === key)).filter(
    (i): i is SiteNavItem => Boolean(i)
  );

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/85 lg:hidden"
    >
      <ul className="mx-auto flex max-w-xl items-stretch justify-around">
        {tabs.map((item) => {
          const active = isNavActive(item.key, pathname);
          const label = SHORT_LABEL[item.key] ?? item.label;
          const inner = (
            <>
              <SiteNavIcon
                name={item.key}
                className={cn("size-6", active ? "text-primary" : "text-muted-foreground")}
              />
              <span
                className={cn(
                  "text-[11px] leading-none",
                  active ? "font-semibold text-primary" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </>
          );
          const cls =
            "flex min-h-14 w-full touch-manipulation flex-col items-center justify-center gap-1 px-1 py-1.5";
          return (
            <li key={item.key} className="min-w-0 flex-1">
              {item.external ? (
                <a href={item.href} target="_blank" rel="noopener noreferrer" className={cls}>
                  {inner}
                  <span className="sr-only"> (opens in new tab)</span>
                </a>
              ) : (
                <Link href={item.href} aria-current={active ? "page" : undefined} className={cls}>
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
