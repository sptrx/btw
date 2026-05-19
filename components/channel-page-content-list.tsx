import Link from "next/link";
import { FileText, MessagesSquare, Mic, Video } from "lucide-react";
import type { PageContentListItem } from "@/actions/channels";
import { RelativeDate } from "@/components/relative-date";
import { cn } from "@/lib/utils";

function ContentTypeIcon({ type }: { type: string }) {
  const cls = "h-3.5 w-3.5 shrink-0";
  switch (type) {
    case "video":
      return <Video className={cls} aria-hidden />;
    case "podcast":
      return <Mic className={cls} aria-hidden />;
    case "discussion":
      return <MessagesSquare className={cls} aria-hidden />;
    default:
      return <FileText className={cls} aria-hidden />;
  }
}

type Props = {
  channelSlug: string;
  items: PageContentListItem[];
  /** When false, hide the page column (e.g. on a single sub-page where every row is the same page). */
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
              className="btw-app-row block"
            >
              <div className="flex flex-col gap-2 sm:gap-2.5">
                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                  <h3 className="min-w-0 font-medium leading-snug">{item.title}</h3>
                  <RelativeDate
                    date={item.created_at}
                    className="shrink-0 text-xs text-muted-foreground tabular-nums"
                  />
                </div>

                <dl className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center">
                    <dt className="sr-only">Content type</dt>
                    <dd>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border border-border/80 bg-muted/50 px-2 py-0.5 font-medium text-foreground/80"
                        )}
                      >
                        <ContentTypeIcon type={item.type} />
                        {item.type_label}
                      </span>
                    </dd>
                  </div>
                  {showPage && item.page_title ? (
                    <div className="flex items-center gap-1">
                      <dt className="font-medium text-muted-foreground/90">Page</dt>
                      <dd>{item.page_title}</dd>
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
