import type { BibleAiNavLink } from "@/lib/bible-ai-config";

export type SiteNavKey = "home" | "explore" | "channels" | "shorts" | "prayer" | "bible" | "ask";

export type SiteNavItem = {
  key: SiteNavKey;
  href: string;
  label: string;
  /** Opens in a new tab (the hosted Bible Q&A) */
  external?: boolean;
};

/** One list drives the left sidebar, the mobile tab bar and the menu. */
export function buildSiteNav(bibleQa: BibleAiNavLink | null | undefined): SiteNavItem[] {
  return [
    { key: "home", href: "/", label: "Home" },
    { key: "explore", href: "/explore", label: "Explore" },
    { key: "channels", href: "/channel/browse", label: "Channels" },
    { key: "shorts", href: "/shorts", label: "Shorts" },
    { key: "prayer", href: "/prayer", label: "Prayer" },
    { key: "bible", href: "/bible", label: "Bible" },
    {
      key: "ask",
      href: bibleQa?.href ?? "/ask",
      label: "Bible Q&A",
      external: bibleQa?.external ?? false,
    },
  ];
}

export function isNavActive(key: SiteNavKey, pathname: string): boolean {
  switch (key) {
    case "home":
      return pathname === "/";
    case "explore":
      return pathname === "/explore";
    case "channels":
      return pathname === "/channel" || pathname.startsWith("/channel/");
    case "shorts":
      return pathname === "/shorts" || pathname.startsWith("/shorts/");
    case "prayer":
      return pathname === "/prayer" || pathname.startsWith("/prayer/");
    case "bible":
      return pathname === "/bible" || pathname.startsWith("/bible/");
    case "ask":
      return pathname === "/ask";
  }
}
