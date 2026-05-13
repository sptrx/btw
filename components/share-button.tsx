"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Link as LinkIcon, Share2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  /**
   * Site-relative path to the resource being shared, e.g. `/channel/foo` or
   * `/channel/foo/content/123`. We deliberately accept a path (not a full
   * URL) so callers can't accidentally leak query strings / session tokens
   * — `buildShareUrl` strips everything except origin + pathname.
   */
  path: string;
  /** Shown in the native share sheet when `navigator.share` is supported. */
  title?: string;
  text?: string;
  /**
   * When false, "Share to my feed" / "Share with a follower" become sign-in
   * prompts. Copy/native-share always work regardless.
   */
  isAuthenticated?: boolean;
  /** Triggers the existing `shareContent` server action (re-post to feed). */
  onShareToFeed?: () => void | Promise<void>;
  /** Opens the in-app "send to follower" flow. */
  onShareWithFollower?: () => void;
  /** Extra controls (e.g. share count) rendered inside the trigger button. */
  countLabel?: string;
  className?: string;
  /** Optional override; defaults to `icon-sm` ghost. */
  size?: "icon-sm" | "icon" | "sm" | "default";
};

/**
 * Produces a clean canonical share URL: `${origin}${pathname}` with no search
 * params or hash, regardless of where the current visitor came from (e.g.
 * `?ref=email`, `?utm_*=…`). Falls back to the raw path during SSR.
 */
function buildShareUrl(path: string): string {
  if (typeof window === "undefined") return path;
  try {
    const u = new URL(path, window.location.origin);
    return `${u.origin}${u.pathname}`;
  } catch {
    return `${window.location.origin}${path}`;
  }
}

export function ShareButton({
  path,
  title,
  text,
  isAuthenticated = false,
  onShareToFeed,
  onShareWithFollower,
  countLabel,
  className,
  size = "icon-sm",
}: Props) {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    []
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  }, []);

  const copyToClipboard = useCallback(
    async (url: string) => {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(url);
        } else {
          // Older Safari / non-secure-context fallback.
          const ta = document.createElement("textarea");
          ta.value = url;
          ta.setAttribute("readonly", "");
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
        }
        setCopied(true);
        showToast("Link copied!");
        setTimeout(() => setCopied(false), 1500);
      } catch {
        showToast("Couldn't copy. Long-press to copy the URL.");
      }
    },
    [showToast]
  );

  const handlePrimaryShare = useCallback(async () => {
    const url = buildShareUrl(path);
    // Prefer the OS share sheet when available (mobile Safari / Chrome / etc.).
    // `canShare` guards against desktop Chrome which exposes `.share` but
    // routes through a less-useful flow for URLs.
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function"
    ) {
      const payload = { title, text, url };
      try {
        if (!navigator.canShare || navigator.canShare(payload)) {
          await navigator.share(payload);
          return;
        }
      } catch (err) {
        // User cancelled the sheet (AbortError) — don't fall through to copy.
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }
    await copyToClipboard(url);
  }, [path, title, text, copyToClipboard]);

  return (
    <div className={cn("relative inline-flex items-center gap-1", className)} ref={menuRef}>
      <Button
        type="button"
        variant="ghost"
        size={size}
        onClick={handlePrimaryShare}
        aria-label="Share"
        title="Share"
      >
        {copied ? <Check aria-hidden /> : <Share2 aria-hidden />}
        {countLabel ? <span className="ml-1 text-xs">{countLabel}</span> : null}
      </Button>

      <Button
        type="button"
        variant="ghost"
        size={size}
        onClick={() => setMenuOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label="More share options"
        title="More share options"
      >
        <span className="text-xs leading-none">⋯</span>
      </Button>

      {menuOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 w-56 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
            onClick={async () => {
              setMenuOpen(false);
              await copyToClipboard(buildShareUrl(path));
            }}
          >
            <LinkIcon className="size-4" aria-hidden />
            Copy link
          </button>

          {isAuthenticated ? (
            <>
              {onShareToFeed && (
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                  onClick={async () => {
                    setMenuOpen(false);
                    await onShareToFeed();
                  }}
                >
                  <Share2 className="size-4" aria-hidden />
                  Share to my feed
                </button>
              )}
              {onShareWithFollower && (
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                  onClick={() => {
                    setMenuOpen(false);
                    onShareWithFollower();
                  }}
                >
                  <Users className="size-4" aria-hidden />
                  Share with a follower
                </button>
              )}
            </>
          ) : (
            <Link
              role="menuitem"
              href={`/auth/login?next=${encodeURIComponent(path)}`}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
              onClick={() => setMenuOpen(false)}
            >
              <Share2 className="size-4" aria-hidden />
              Sign in to share to your feed
            </Link>
          )}
        </div>
      )}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-sm text-background shadow-lg"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

export default ShareButton;
