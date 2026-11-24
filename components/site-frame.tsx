"use client";

import { usePathname } from "next/navigation";
import { NavCollapseProvider, useNavCollapse } from "@/components/nav-collapse-context";
import { cn } from "@/lib/utils";

function Frame({
  nav,
  right,
  tabBar,
  children,
}: {
  nav: React.ReactNode;
  right: React.ReactNode;
  tabBar: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const channelPage = pathname === "/channel" || pathname.startsWith("/channel/");
  const { collapsed } = useNavCollapse();

  const left = collapsed ? "4.25rem" : "13.5rem";

  return (
    <div
      style={{ ["--btw-nav-w" as string]: left }}
      className={cn(
        "mx-auto w-full max-w-[1240px] px-3 sm:px-4 lg:grid lg:items-start lg:gap-5 lg:px-5",
        "lg:grid-cols-[var(--btw-nav-w)_minmax(0,1fr)]",
        !channelPage && "xl:grid-cols-[var(--btw-nav-w)_minmax(0,1fr)_18.5rem] xl:gap-6"
      )}
    >
      <aside
        aria-label="Site"
        className="sticky top-[calc(var(--header-bar-height)+0.75rem)] hidden max-h-[calc(100dvh-var(--header-bar-height)-1.5rem)] overflow-y-auto py-4 lg:block"
      >
        {nav}
      </aside>
      <main
        id="main-content"
        tabIndex={-1}
        className="btw-main min-w-0 py-4 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:py-5"
      >
        {children}
      </main>
      {channelPage ? null : right}
      {tabBar}
    </div>
  );
}

/**
 * App shell: collapsible navigation on the left (large screens), content in the
 * middle, helpers on the right (extra-large screens). On phones and tablets the
 * navigation becomes a bottom tab bar.
 */
export function SiteFrame(props: {
  nav: React.ReactNode;
  right: React.ReactNode;
  tabBar: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <NavCollapseProvider>
      <Frame {...props} />
    </NavCollapseProvider>
  );
}
