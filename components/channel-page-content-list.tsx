import Link from "next/link";
import type { PageContentListItem } from "@/actions/channels";
import { RelativeDate } from "@/components/relative-date";
import { SharingTypeBadge } from "@/components/sharing-type-badge";
import { cn } from "@/lib/utils";

type Props = {
  channelSlug: string;
  items: PageContentListItem[];
  showPage?: boolean;
  emptyMessage?: string;
};

export function ChannelPageContentList({
  channelSlug,
  items,
  showPage = true,
  emptyMessage = "No content yet.",
}: Props) {
  if (items.length === 0) {
    return <div className="btw-empty">{emptyMessage}</div>;
  }

  return (
    <ul className="space-y-3" role="list">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={`/channel/${channelSlug}/content/${item.id}`}
            className="btw-app-row block relative"
          >
            <div className="absolute left-3 top-3 z-10 sm:left-4">
              <SharingTypeBadge sharingType={item.sharing_type} />
            </div>
            <div className="flex flex-col gap-2 sm:gap-2.5 pt-7">
              <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                <h3 className="min-w-0 font-medium leading-snug">{item.title}</h3>
                <RelativeDate
                  date={item.created_at}
                  className="shrink-0 text-xs text-muted-foreground tabular-nums"
                />
              </div>

              <dl className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-muted-foreground">
                {showPage && item.page_title ? (
                  <div className="flex items-center gap-1">
                    <dt className="font-medium text-muted-foreground/90">Page</dt>
                    <dd>{item.page_title}</dd>
                  </div>
                ) : null}
                {item.type !== "article" ? (
                  <div className="flex items-center">
                    <dt className="sr-only">Format</dt>
                    <dd>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                        )}
                      >
                        {item.type_label}
                      </span>
                    </dd>
                  </div>
                ) : null}
              </dl>

              {item.body ? (
                <p className="text-sm text-muted-foreground line-clamp-2">{item.body}</p>
              ) : null}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
