"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  Folder,
  Home,
  MessageCircle,
  Pencil,
  PlayCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import AddPageLink from "./add-page-link";

export type ChannelSidebarPage = {
  id: string;
  slug: string;
  title: string;
  post_count?: number;
  derived_type?: "video" | "podcast" | "article" | "discussion" | "mixed";
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

const ROW_BASE =
  "flex items-center gap-2 rounded-md border-l-2 py-2 pl-[10px] pr-3 text-sm transition-colors";
const ROW_ACTIVE =
  "border-primary bg-primary/10 text-primary font-medium";
const ROW_INACTIVE =
  "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground";

function iconForPageType(
  derived: ChannelSidebarPage["derived_type"]
): LucideIcon {
  switch (derived) {
    case "video":
      return PlayCircle;
    case "article":
      return FileText;
    case "discussion":
      return MessageCircle;
    default:
      return Folder;
  }
}

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

  const homePage = pages.find((p) => p.slug === "home");
  const subPages = pages.filter((p) => p.slug !== "home");

  /** Home nav is active only on the exact channel root URL. */
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

        <nav
          className="mt-5 flex flex-col gap-0.5 border-t border-border pt-4"
          aria-label="Channel pages"
        >
          <Link
            href={base}
            className={cn(ROW_BASE, homeNavActive ? ROW_ACTIVE : ROW_INACTIVE)}
            aria-current={homeNavActive ? "page" : undefined}
          >
            <Home className="size-4 shrink-0" aria-hidden />
            <span className="truncate">Home</span>
            {typeof homePage?.post_count === "number" && (
              <span className="text-xs text-muted-foreground tabular-nums">
                ({homePage.post_count})
              </span>
            )}
          </Link>
          {isAuthor && homePageId && (
            <Link
              href={`${base}/pages/${homePageId}/edit`}
              className="block pl-9 -mt-0.5 pb-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Edit home page
            </Link>
          )}

          {subPages.map((p) => {
            const href = `${base}/${p.slug}`;
            const active = pathname === href || pathname.startsWith(`${href}/`);
            const Icon = iconForPageType(p.derived_type);
            return (
              <div key={p.id} className="flex items-center gap-0.5">
                <Link
                  href={href}
                  className={cn(
                    ROW_BASE,
                    active ? ROW_ACTIVE : ROW_INACTIVE,
                    "min-w-0 flex-1"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  <span className="truncate">{p.title}</span>
                  {typeof p.post_count === "number" && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      ({p.post_count})
                    </span>
                  )}
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
              <Link
                href={`${base}/settings`}
                className={cn(ROW_BASE, isSettings ? ROW_ACTIVE : ROW_INACTIVE)}
                aria-current={isSettings ? "page" : undefined}
              >
                <span className="truncate">Settings</span>
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
