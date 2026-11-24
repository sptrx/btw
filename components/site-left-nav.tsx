"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, PenSquare } from "lucide-react";
import { useNavCollapse } from "@/components/nav-collapse-context";
import { SiteNavIcon } from "@/components/site-nav-icon";
import { isNavActive, type SiteNavItem } from "@/lib/site-nav";
import { cn } from "@/lib/utils";

type Props = {
  items: SiteNavItem[];
  isLoggedIn: boolean;
  /** Slug of the signed-in user's most recent channel, if any */
  channelSlug: string | null;
};

/**
 * Persistent primary navigation for desktop (X / Reddit style). It can collapse to
 * icons only. Sign in and Sign up live in the header, not here.
 */
export function SiteLeftNav({ items, isLoggedIn, channelSlug }: Props) {
  const pathname = usePathname();
  const { collapsed, toggle } = useNavCollapse();

  const createHref = channelSlug ? `/channel/${channelSlug}/content/new` : "/channel/new";
  const createLabel = channelSlug ? "New post" : "Create channel";

  return (
    <nav aria-label="Primary" className="space-y-2">
      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? "Expand menu" : "Collapse menu"}
        aria-expanded={!collapsed}
        title={collapsed ? "Expand menu" : "Collapse menu"}
        className={cn(
          "flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
          !collapsed && "ml-auto"
        )}
      >
        {collapsed ? (
          <PanelLeftOpen className="size-5" aria-hidden />
        ) : (
          <PanelLeftClose className="size-5" aria-hidden />
        )}
      </button>

      <ul className="space-y-0.5">
        {items.map((item) => {
          const active = isNavActive(item.key, pathname);
          const content = (
            <>
              <SiteNavIcon
                name={item.key}
                className={cn("size-5 shrink-0", active ? "text-primary" : "text-muted-foreground")}
              />
              <span className={cn("truncate", collapsed && "sr-only")}>{item.label}</span>
              {item.external ? <span className="sr-only"> (opens in new tab)</span> : null}
            </>
          );
          const cls = cn(
            "flex min-h-11 items-center rounded-full text-[15px] transition-colors",
            collapsed ? "mx-auto size-11 justify-center" : "gap-3 px-3.5 py-2",
            active
              ? "bg-primary/10 font-semibold text-primary"
              : "font-medium text-foreground hover:bg-muted"
          );
          return (
            <li key={item.key}>
              {item.external ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={collapsed ? item.label : undefined}
                  className={cls}
                >
                  {content}
                </a>
              ) : (
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  title={collapsed ? item.label : undefined}
                  className={cls}
                >
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      {isLoggedIn ? (
        <Link
          href={createHref}
          title={collapsed ? createLabel : undefined}
          className={cn(
            "flex items-center justify-center bg-primary font-semibold text-primary-foreground transition-colors hover:bg-primary/90",
            collapsed ? "mx-auto size-11 rounded-full" : "h-11 w-full gap-2 rounded-full text-[15px]"
          )}
        >
          <PenSquare className="size-4 shrink-0" aria-hidden />
          <span className={cn(collapsed && "sr-only")}>{createLabel}</span>
        </Link>
      ) : null}
    </nav>
  );
}
