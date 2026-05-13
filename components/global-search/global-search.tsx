"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Hash,
  FileText,
  User,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";

type ChannelHit = {
  kind: "channel";
  id: string;
  title: string;
  slug: string;
  description: string | null;
};

type PostHit = {
  kind: "post";
  id: string;
  title: string;
  body: string | null;
  channelSlug: string;
  channelTitle: string | null;
};

type AuthorHit = {
  kind: "author";
  id: string;
  display_name: string;
};

type Hit = ChannelHit | PostHit | AuthorHit;

type Grouped = {
  channels: ChannelHit[];
  posts: PostHit[];
  authors: AuthorHit[];
};

const DEBOUNCE_MS = 300;
const MIN_CHARS = 2;
const PER_GROUP = 5;

// Escape LIKE wildcards so they're treated as literal text by Postgres.
// `.ilike()` URL-encodes the value, but `%` and `_` are SQL LIKE metacharacters.
function escapeLike(input: string): string {
  return input.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

function snippet(text: string | null | undefined, max = 120): string {
  if (!text) return "";
  const s = text.replace(/\s+/g, " ").trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function dedupeById<T extends { id: string }>(rows: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const r of rows) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    out.push(r);
  }
  return out;
}

type TopicRow = { id: string; title: string; slug: string; description: string | null };
type ContentRow = {
  id: string;
  title: string;
  body: string | null;
  topics: { slug: string; title: string } | { slug: string; title: string }[] | null;
};
type ProfileRow = { id: string; display_name: string | null };

function flatten<T>(rows: (T[] | null | undefined)[]): T[] {
  const out: T[] = [];
  for (const r of rows) if (r) out.push(...r);
  return out;
}

async function runSearch(
  supabase: ReturnType<typeof createClient>,
  raw: string,
  signal: AbortSignal
): Promise<Grouped> {
  const escaped = escapeLike(raw.trim());
  const pattern = `%${escaped}%`;

  // Run column-wise ilike queries in parallel, dedupe per group.
  const [
    channelsByTitle,
    channelsByDesc,
    postsByTitle,
    postsByBody,
    authorsByName,
  ] = await Promise.all([
    supabase
      .from("topics")
      .select("id, title, slug, description")
      .ilike("title", pattern)
      .limit(PER_GROUP)
      .abortSignal(signal),
    supabase
      .from("topics")
      .select("id, title, slug, description")
      .ilike("description", pattern)
      .limit(PER_GROUP)
      .abortSignal(signal),
    supabase
      .from("topic_content")
      .select("id, title, body, topics!inner(slug, title)")
      .ilike("title", pattern)
      .limit(PER_GROUP)
      .abortSignal(signal),
    supabase
      .from("topic_content")
      .select("id, title, body, topics!inner(slug, title)")
      .ilike("body", pattern)
      .limit(PER_GROUP)
      .abortSignal(signal),
    supabase
      .from("profiles")
      .select("id, display_name")
      .ilike("display_name", pattern)
      .limit(PER_GROUP)
      .abortSignal(signal),
  ]);

  const channelRows = dedupeById(
    flatten<TopicRow>([channelsByTitle.data, channelsByDesc.data])
  ).slice(0, PER_GROUP);

  const postRows = dedupeById(
    flatten<ContentRow>([postsByTitle.data, postsByBody.data])
  ).slice(0, PER_GROUP);

  const authorRows = dedupeById(
    flatten<ProfileRow>([authorsByName.data])
  ).slice(0, PER_GROUP);

  const channels: ChannelHit[] = channelRows.map((r) => ({
    kind: "channel",
    id: r.id,
    title: r.title,
    slug: r.slug,
    description: r.description,
  }));

  const posts: PostHit[] = postRows
    .map((r): PostHit | null => {
      const t = Array.isArray(r.topics) ? r.topics[0] : r.topics;
      if (!t?.slug) return null;
      return {
        kind: "post",
        id: r.id,
        title: r.title,
        body: r.body,
        channelSlug: t.slug,
        channelTitle: t.title,
      };
    })
    .filter((p): p is PostHit => p !== null);

  const authors: AuthorHit[] = authorRows
    .filter((r) => r.display_name && r.display_name.trim().length > 0)
    .map((r) => ({
      kind: "author",
      id: r.id,
      display_name: r.display_name as string,
    }));

  return { channels, posts, authors };
}

function hitHref(h: Hit): string {
  switch (h.kind) {
    case "channel":
      return `/channel/${h.slug}`;
    case "post":
      return `/channel/${h.channelSlug}/content/${h.id}`;
    case "author":
      return `/profile/${h.id}`;
  }
}

function hitDomId(h: Hit, idx: number): string {
  return `gs-opt-${h.kind}-${idx}-${h.id}`;
}

export function GlobalSearch({ className }: { className?: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [grouped, setGrouped] = React.useState<Grouped>({
    channels: [],
    posts: [],
    authors: [],
  });
  const [loading, setLoading] = React.useState(false);
  const [activeIdx, setActiveIdx] = React.useState(0);

  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);
  const reqIdRef = React.useRef(0);

  // Flat list of hits in render order — used for keyboard nav.
  const flatHits = React.useMemo<Hit[]>(
    () => [...grouped.channels, ...grouped.posts, ...grouped.authors],
    [grouped]
  );

  const trimmed = query.trim();
  const tooShort = trimmed.length < MIN_CHARS;

  // Debounced query execution.
  React.useEffect(() => {
    if (!open) return;
    if (tooShort) {
      setGrouped({ channels: [], posts: [], authors: [] });
      setLoading(false);
      return;
    }

    const reqId = ++reqIdRef.current;
    const controller = new AbortController();
    setLoading(true);

    const handle = window.setTimeout(async () => {
      const supabase = createClient();
      try {
        const next = await runSearch(supabase, trimmed, controller.signal);
        if (reqIdRef.current === reqId) {
          setGrouped(next);
          setActiveIdx(0);
        }
      } catch (e) {
        if (controller.signal.aborted) return;
        // Swallow — show empty results. Logged for debugging only.
        if (process.env.NODE_ENV !== "production") {
          console.error("[global-search] query failed:", e);
        }
        if (reqIdRef.current === reqId) {
          setGrouped({ channels: [], posts: [], authors: [] });
        }
      } finally {
        if (reqIdRef.current === reqId) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(handle);
      controller.abort();
    };
  }, [trimmed, tooShort, open]);

  // Focus the input on open; return focus to trigger on close.
  React.useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(t);
    }
    triggerRef.current?.focus();
  }, [open]);

  // Lock body scroll while overlay is open.
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const close = React.useCallback(() => {
    setOpen(false);
    setQuery("");
    setGrouped({ channels: [], posts: [], authors: [] });
    setActiveIdx(0);
  }, []);

  const navigateTo = React.useCallback(
    (h: Hit) => {
      const href = hitHref(h);
      close();
      // Defer push so overlay teardown isn't in the back-button history.
      window.setTimeout(() => router.push(href), 0);
    },
    [router, close]
  );

  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === "ArrowDown") {
        if (flatHits.length === 0) return;
        e.preventDefault();
        setActiveIdx((i) => (i + 1) % flatHits.length);
        return;
      }
      if (e.key === "ArrowUp") {
        if (flatHits.length === 0) return;
        e.preventDefault();
        setActiveIdx((i) => (i - 1 + flatHits.length) % flatHits.length);
        return;
      }
      if (e.key === "Enter") {
        if (flatHits.length === 0) return;
        e.preventDefault();
        const hit = flatHits[activeIdx] ?? flatHits[0];
        if (hit) navigateTo(hit);
        return;
      }
    },
    [flatHits, activeIdx, navigateTo, close]
  );

  // Ensure the active option is scrolled into view.
  React.useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    if (!list) return;
    const hit = flatHits[activeIdx];
    if (!hit) return;
    const el = list.querySelector<HTMLElement>(
      `#${CSS.escape(hitDomId(hit, activeIdx))}`
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx, flatHits, open]);

  const listboxId = "global-search-listbox";
  const activeHit = flatHits[activeIdx];
  const activeId = activeHit ? hitDomId(activeHit, activeIdx) : undefined;

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        variant="ghost"
        size="icon"
        className={cn("size-11 touch-manipulation", className)}
        aria-label="Search"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4" aria-hidden />
      </Button>

      {open && (
        <SearchOverlay
          listboxId={listboxId}
          activeId={activeId}
          query={query}
          onQueryChange={setQuery}
          onKeyDown={onKeyDown}
          loading={loading}
          tooShort={tooShort}
          trimmed={trimmed}
          grouped={grouped}
          flatHits={flatHits}
          activeIdx={activeIdx}
          onActivate={navigateTo}
          onHover={setActiveIdx}
          onClose={close}
          inputRef={inputRef}
          listRef={listRef}
        />
      )}
    </>
  );
}

type OverlayProps = {
  listboxId: string;
  activeId: string | undefined;
  query: string;
  onQueryChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  loading: boolean;
  tooShort: boolean;
  trimmed: string;
  grouped: Grouped;
  flatHits: Hit[];
  activeIdx: number;
  onActivate: (h: Hit) => void;
  onHover: (i: number) => void;
  onClose: () => void;
  inputRef: React.Ref<HTMLInputElement>;
  listRef: React.Ref<HTMLUListElement>;
};

function SearchOverlay(props: OverlayProps) {
  const {
    listboxId,
    activeId,
    query,
    onQueryChange,
    onKeyDown,
    loading,
    tooShort,
    trimmed,
    grouped,
    flatHits,
    activeIdx,
    onActivate,
    onHover,
    onClose,
    inputRef,
    listRef,
  } = props;

  const hasResults = flatHits.length > 0;
  const showEmpty = !tooShort && !loading && !hasResults;

  // Index offsets so each group renders with the right flat index.
  const channelStart = 0;
  const postStart = grouped.channels.length;
  const authorStart = grouped.channels.length + grouped.posts.length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      className="fixed inset-0 z-[60]"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close search"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 w-full h-full bg-foreground/10 dark:bg-black/40 backdrop-blur-[1px] cursor-default"
      />

      {/* Mobile sheet — full screen below md */}
      <div
        className={cn(
          "absolute inset-0 flex flex-col bg-popover text-popover-foreground",
          "md:hidden"
        )}
      >
        <div className="flex items-center gap-2 border-b border-border px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search channels, posts, authors…"
            role="combobox"
            aria-expanded={hasResults}
            aria-controls={listboxId}
            aria-activedescendant={activeId}
            aria-autocomplete="list"
            autoComplete="off"
            spellCheck={false}
            className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 touch-manipulation"
            aria-label="Close search"
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </div>
        <ResultsBody
          listboxId={listboxId}
          listRef={listRef}
          tooShort={tooShort}
          showEmpty={showEmpty}
          trimmed={trimmed}
          grouped={grouped}
          channelStart={channelStart}
          postStart={postStart}
          authorStart={authorStart}
          activeIdx={activeIdx}
          onActivate={onActivate}
          onHover={onHover}
        />
      </div>

      {/* Desktop dropdown — md and up */}
      <div className="hidden md:block">
        <div className="absolute left-1/2 top-16 z-10 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2">
          <div className="rounded-xl border border-border bg-popover text-popover-foreground shadow-lg">
            <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search channels, posts, authors…"
                role="combobox"
                aria-expanded={hasResults}
                aria-controls={listboxId}
                aria-activedescendant={activeId}
                aria-autocomplete="list"
                autoComplete="off"
                spellCheck={false}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {loading && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />
              )}
              <kbd className="hidden sm:inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                Esc
              </kbd>
            </div>
            <ResultsBody
              listboxId={listboxId}
              listRef={listRef}
              tooShort={tooShort}
              showEmpty={showEmpty}
              trimmed={trimmed}
              grouped={grouped}
              channelStart={channelStart}
              postStart={postStart}
              authorStart={authorStart}
              activeIdx={activeIdx}
              onActivate={onActivate}
              onHover={onHover}
              maxHeightClass="max-h-[70vh]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

type ResultsBodyProps = {
  listboxId: string;
  listRef: React.Ref<HTMLUListElement>;
  tooShort: boolean;
  showEmpty: boolean;
  trimmed: string;
  grouped: Grouped;
  channelStart: number;
  postStart: number;
  authorStart: number;
  activeIdx: number;
  onActivate: (h: Hit) => void;
  onHover: (i: number) => void;
  maxHeightClass?: string;
};

function ResultsBody(props: ResultsBodyProps) {
  const {
    listboxId,
    listRef,
    tooShort,
    showEmpty,
    trimmed,
    grouped,
    channelStart,
    postStart,
    authorStart,
    activeIdx,
    onActivate,
    onHover,
    maxHeightClass,
  } = props;

  return (
    <div
      className={cn(
        "flex-1 overflow-y-auto overscroll-contain",
        maxHeightClass
      )}
    >
      {tooShort ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">
          Type at least {MIN_CHARS} characters to search.
        </p>
      ) : showEmpty ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">
          No results for &ldquo;{trimmed}&rdquo;.
        </p>
      ) : (
        <ul
          id={listboxId}
          ref={listRef}
          role="listbox"
          aria-label="Search results"
          className="py-1"
        >
          {grouped.channels.length > 0 && (
            <Group label="Channels">
              {grouped.channels.map((h, i) => {
                const idx = channelStart + i;
                return (
                  <ResultRow
                    key={`c-${h.id}`}
                    domId={hitDomId(h, idx)}
                    active={idx === activeIdx}
                    onActivate={() => onActivate(h)}
                    onHover={() => onHover(idx)}
                    icon={<Hash className="h-4 w-4" aria-hidden />}
                    primary={h.title}
                    secondary={snippet(h.description)}
                  />
                );
              })}
            </Group>
          )}
          {grouped.posts.length > 0 && (
            <Group label="Posts">
              {grouped.posts.map((h, i) => {
                const idx = postStart + i;
                return (
                  <ResultRow
                    key={`p-${h.id}`}
                    domId={hitDomId(h, idx)}
                    active={idx === activeIdx}
                    onActivate={() => onActivate(h)}
                    onHover={() => onHover(idx)}
                    icon={<FileText className="h-4 w-4" aria-hidden />}
                    primary={h.title}
                    secondary={
                      h.channelTitle
                        ? `${h.channelTitle} · ${snippet(h.body, 80)}`
                        : snippet(h.body, 120)
                    }
                  />
                );
              })}
            </Group>
          )}
          {grouped.authors.length > 0 && (
            <Group label="Authors">
              {grouped.authors.map((h, i) => {
                const idx = authorStart + i;
                return (
                  <ResultRow
                    key={`a-${h.id}`}
                    domId={hitDomId(h, idx)}
                    active={idx === activeIdx}
                    onActivate={() => onActivate(h)}
                    onHover={() => onHover(idx)}
                    icon={<User className="h-4 w-4" aria-hidden />}
                    primary={h.display_name}
                    secondary=""
                  />
                );
              })}
            </Group>
          )}
        </ul>
      )}
    </div>
  );
}

function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li role="presentation" className="py-1">
      <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <ul role="presentation">{children}</ul>
    </li>
  );
}

function ResultRow({
  domId,
  active,
  onActivate,
  onHover,
  icon,
  primary,
  secondary,
}: {
  domId: string;
  active: boolean;
  onActivate: () => void;
  onHover: () => void;
  icon: React.ReactNode;
  primary: string;
  secondary: string;
}) {
  return (
    <li
      id={domId}
      role="option"
      aria-selected={active}
      onMouseEnter={onHover}
      onMouseDown={(e) => {
        // Prevent input blur before click handler fires.
        e.preventDefault();
        onActivate();
      }}
      className={cn(
        "flex items-start gap-2.5 px-3 py-2 cursor-pointer rounded-md mx-1",
        active ? "bg-muted text-foreground" : "hover:bg-muted/60"
      )}
    >
      <span className="mt-0.5 text-muted-foreground shrink-0">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{primary}</span>
        {secondary && (
          <span className="block truncate text-xs text-muted-foreground">
            {secondary}
          </span>
        )}
      </span>
    </li>
  );
}
