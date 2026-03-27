"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import AddPageLink from "./add-page-link";

export type ChannelSidebarPage = {
  id: string;
  slug: string;
  title: string;
};

type ChannelSidebarChannel = {
  id: string;
  title: string;
  description: string | null;
  profiles: { display_name?: string } | null;
};

type Props = {
  channel: ChannelSidebarChannel;
  channelSlug: string;
  pages: ChannelSidebarPage[];
  isAuthor: boolean;
  homePageId: string | null;
};

export default function ChannelSidebar({
  channel,
  channelSlug,
  pages,
  isAuthor,
  homePageId,
}: Props) {
  const pathname = usePathname();
  const base = `/channel/${channelSlug}`;
  const author = channel.profiles;

  const isExactHome = pathname === base || pathname === `${base}/`;

  const isSettings =
    pathname === `${base}/settings` ||
    pathname.startsWith(`${base}/settings/`);

  const isUnderContent = pathname.startsWith(`${base}/content`);
  const isUnderPagesNew = pathname.startsWith(`${base}/pages/`);

  const subPages = pages.filter((p) => p.slug !== "home");

  const linkClass = (active: boolean) =>
    `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      active
        ? "bg-primary/15 text-primary"
        : "text-foreground hover:bg-muted"
    }`;

  /** Home nav is active on the main channel URL only (not settings, not subpages, not content tools). */
  const homeNavActive =
    isExactHome && !isSettings && !isUnderContent && !isUnderPagesNew;

  return (
    <aside className="w-full shrink-0 lg:w-64 lg:sticky lg:top-20 lg:self-start">
      <div className="btw-content-panel">
        <Link href={base} className="block">
          <h1 className="text-lg font-bold tracking-tight leading-snug hover:text-primary transition-colors">
            {channel.title}
          </h1>
        </Link>
        <p className="text-muted-foreground text-sm mt-1">
          by {author?.display_name ?? "Anonymous"}
        </p>
        {channel.description && (
          <p className="mt-3 text-sm text-muted-foreground line-clamp-6">{channel.description}</p>
        )}

        <nav className="mt-5 flex flex-col gap-1 border-t border-border pt-4" aria-label="Channel pages">
          <div className="space-y-0.5">
            <Link href={base} className={linkClass(homeNavActive)}>
              Home
            </Link>
            {isAuthor && homePageId && (
              <Link
                href={`${base}/pages/${homePageId}/edit`}
                className="block pl-3 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Edit home page
              </Link>
            )}
          </div>
          {subPages.map((p) => {
            const href = `${base}/${p.slug}`;
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <div key={p.id} className="flex items-center gap-0.5">
                <Link href={href} className={cn(linkClass(active), "min-w-0 flex-1")}>
                  {p.title}
                </Link>
                {isAuthor && (
                  <Link
                    href={`${base}/pages/${p.id}/edit`}
                    className="inline-flex shrink-0 items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label={`Edit ${p.title}`}
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </Link>
                )}
              </div>
            );
          })}
          {isAuthor && (
            <>
              <Link href={`${base}/settings`} className={linkClass(isSettings)}>
                Settings
              </Link>
              <div className="flex flex-col gap-2 pt-2 border-t border-border mt-2">
                <AddPageLink channelId={channel.id} channelSlug={channelSlug} />
              </div>
            </>
          )}
        </nav>
      </div>
    </aside>
  );
}
