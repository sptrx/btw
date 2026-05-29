"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export type ProfileTab = "posts" | "channels" | "following" | "followers";

const TABS: { id: ProfileTab; label: string }[] = [
  { id: "posts", label: "Posts" },
  { id: "channels", label: "Channels" },
  { id: "following", label: "Following" },
  { id: "followers", label: "Followers" },
];

type Props = {
  basePath: string;
};

export function ProfileTabs({ basePath }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = (searchParams.get("tab") as ProfileTab) || "posts";

  return (
    <nav
      className="flex gap-1 overflow-x-auto border-b border-border/80 pb-px scrollbar-none"
      aria-label="Profile sections"
    >
      {TABS.map((tab) => {
        const href = tab.id === "posts" ? basePath : `${basePath}?tab=${tab.id}`;
        const isActive = pathname === basePath && active === tab.id;
        return (
          <Link
            key={tab.id}
            href={href}
            className={cn(
              "shrink-0 rounded-t-md px-4 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
