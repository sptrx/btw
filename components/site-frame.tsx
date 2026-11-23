"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function SiteFrame({
  left,
  right,
  children,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const channelPage = pathname === "/channel" || pathname.startsWith("/channel/");
  const home = pathname === "/";

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1240px] px-3 sm:px-4 lg:px-5",
        home &&
          "lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:items-start lg:gap-5 xl:grid-cols-[15.5rem_minmax(0,1fr)_18.5rem] xl:gap-6",
        !home &&
          !channelPage &&
          "xl:grid xl:grid-cols-[minmax(0,1fr)_18.5rem] xl:items-start xl:gap-6"
      )}
    >
      {home ? left : null}
      <main
        id="main-content"
        tabIndex={-1}
        className="btw-main min-w-0 py-4 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:py-5"
      >
        {children}
      </main>
      {channelPage ? null : right}
    </div>
  );
}
