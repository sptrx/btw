"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, Heart, MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RelativeDate } from "@/components/relative-date";
import { cn } from "@/lib/utils";
import {
  getMyNotifications,
  getMyUnreadNotificationCount,
  markAllNotificationsRead,
  type NotificationItem,
} from "@/actions/notifications";

const POLL_INTERVAL_MS = 60_000;

type Props = {
  /** Extra classes applied to the bell trigger (used when the header is over a dark hero image). */
  className?: string;
};

/**
 * Header bell that shows a badge of unread notifications and a dropdown of
 * recent items. The badge count is fetched on mount and polled lightly while
 * the tab is visible; opening the dropdown marks everything read.
 *
 * The dropdown lives in the header tree (no portals) so the existing sticky
 * z-50 header places it above page content without extra work. We close on
 * outside click + Escape, and we render the panel via fixed positioning on
 * mobile so the trigger's `overflow:hidden` ancestors don't clip it.
 */
export function NotificationBell({ className }: Props) {
  const [open, setOpen] = React.useState(false);
  const [unread, setUnread] = React.useState(0);
  const [items, setItems] = React.useState<NotificationItem[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  // Refresh the unread badge on mount, on tab focus, and every minute while
  // the tab is visible. This is cheap (a single COUNT query) and keeps the
  // header lively without needing realtime websockets.
  React.useEffect(() => {
    let cancelled = false;

    const refreshCount = async () => {
      try {
        const next = await getMyUnreadNotificationCount();
        if (!cancelled) setUnread(next);
      } catch {
        /* swallow — bell stays at last known value */
      }
    };

    refreshCount();

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") refreshCount();
    }, POLL_INTERVAL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") refreshCount();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Load notifications when the panel opens, then mark everything read.
  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const next = await getMyNotifications();
        if (!cancelled) setItems(next);
        await markAllNotificationsRead();
        if (!cancelled) setUnread(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open]);

  // Close on outside click + Escape.
  React.useEffect(() => {
    if (!open) return;

    const onClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (containerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const badgeLabel = unread > 99 ? "99+" : String(unread);

  return (
    <div ref={containerRef} className="relative">
      <Button
        ref={triggerRef}
        type="button"
        variant="ghost"
        size="icon"
        className={cn("relative size-11 touch-manipulation", className)}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((o) => !o)}
      >
        <Bell className="h-4 w-4" aria-hidden />
        {unread > 0 && (
          <span
            aria-hidden
            className="absolute -right-0.5 -top-0.5 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-destructive px-1 py-0.5 text-[10px] font-semibold leading-none text-destructive-foreground ring-2 ring-background"
          >
            {badgeLabel}
          </span>
        )}
      </Button>

      {open && (
        <div
          ref={panelRef}
          role="menu"
          aria-label="Notifications"
          className={cn(
            // Mobile: anchor to viewport so the panel isn't clipped by header internals.
            "fixed left-2 right-2 top-[calc(env(safe-area-inset-top)+3.5rem)] z-[60] mx-auto max-w-md",
            // Desktop: anchor to the trigger.
            "md:absolute md:left-auto md:right-0 md:top-full md:mt-2 md:w-96 md:max-w-none"
          )}
        >
          <div className="rounded-xl border border-border bg-popover text-popover-foreground shadow-lg">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <p className="text-sm font-semibold">Notifications</p>
              {loading && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" aria-hidden />
              )}
            </div>

            <div className="max-h-[70vh] overflow-y-auto overscroll-contain">
              {items === null && loading ? (
                <p className="px-4 py-6 text-sm text-muted-foreground">Loading…</p>
              ) : items && items.length > 0 ? (
                <ul className="py-1">
                  {items.map((n) => (
                    <NotificationRow
                      key={n.id}
                      item={n}
                      onNavigate={() => setOpen(false)}
                    />
                  ))}
                </ul>
              ) : (
                <p className="px-4 py-6 text-sm text-muted-foreground">
                  You&apos;re all caught up.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationRow({
  item,
  onNavigate,
}: {
  item: NotificationItem;
  onNavigate: () => void;
}) {
  const actorName = item.actor.display_name?.trim() || "Someone";
  const isUnread = item.read_at === null;
  const Icon = item.type === "like" ? Heart : MessageCircle;
  const iconTint = item.type === "like" ? "text-rose-500" : "text-indigo-500";
  const action = item.type === "like" ? "liked your post" : "commented on your post";

  const body = (
    <div className="flex items-start gap-3 px-3 py-2.5">
      <div className="relative mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className={cn("h-3.5 w-3.5", iconTint)} aria-hidden />
        {isUnread && (
          <span
            aria-hidden
            className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-popover"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="font-medium">{actorName}</span>{" "}
          <span className="text-muted-foreground">{action}</span>
          {item.content_title && (
            <>
              {" "}
              <span className="font-medium">{item.content_title}</span>
            </>
          )}
        </p>
        {item.comment_preview && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            &ldquo;{item.comment_preview}&rdquo;
          </p>
        )}
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          <RelativeDate date={item.created_at} />
        </p>
      </div>
    </div>
  );

  return (
    <li role="menuitem" className={cn(isUnread && "bg-muted/40")}>
      {item.href ? (
        <Link
          href={item.href}
          prefetch={false}
          onClick={onNavigate}
          className="block hover:bg-muted focus-visible:outline-none focus-visible:bg-muted"
        >
          {body}
        </Link>
      ) : (
        <div className="opacity-70">{body}</div>
      )}
    </li>
  );
}
