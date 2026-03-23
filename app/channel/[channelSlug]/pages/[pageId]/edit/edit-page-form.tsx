"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updateChannelPage } from "@/actions/channels";
import { Button } from "@/components/ui/button";
import { PageDeleteForm } from "./page-delete-form";
import type { ChannelPageRow, PageContentListItem } from "@/actions/channels";
import AddContentLink from "../../../add-content-link";

type Page = ChannelPageRow;

type Props = {
  channelId: string;
  channelSlug: string;
  page: Page;
  /** Posts currently on this page (same as on the public page view). */
  pageContent: PageContentListItem[];
};

function formatSavedAt(iso: string | null | undefined) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return null;
  }
}

const typeLabels: Record<string, string> = {
  video: "Video",
  podcast: "Podcast",
  article: "Article",
  discussion: "Discussion",
};

export default function EditPageForm({ channelId, channelSlug, page, pageContent }: Props) {
  const isHome = page.slug === "home";

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await updateChannelPage(formData);
      return result && "error" in result ? { error: result.error } : null;
    },
    null as { error?: string } | null
  );

  const base = `/channel/${channelSlug}`;
  const publicUrl = isHome ? base : `${base}/${page.slug}`;
  const savedAt = formatSavedAt(page.updated_at);
  /** Remount form when server sends fresh page data after navigation */
  const formKey = `${page.id}-${page.updated_at ?? ""}-${page.title}-${page.slug}`;

  return (
    <div className="space-y-8">
      <section
        className="rounded-xl border-2 border-primary/25 bg-primary/5 p-6 shadow-sm"
        aria-labelledby="edit-page-content-heading"
      >
        <h2 id="edit-page-content-heading" className="text-lg font-semibold mb-2">
          Content on this page
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Posts linked to <span className="font-medium text-foreground">{page.title}</span>. Open a post to
          view it, or edit to change title, body, and media.
        </p>

        <div className="space-y-3 mb-6">
          {pageContent.length === 0 ? (
            <p className="text-sm text-muted-foreground rounded-lg border border-dashed border-border bg-background/60 px-4 py-6 text-center">
              No posts on this page yet. Add one below.
            </p>
          ) : (
            pageContent.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border bg-background/90 p-4"
              >
                <div className="min-w-0">
                  <span className="text-xs px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                    {typeLabels[item.type] ?? item.type}
                  </span>
                  <p className="font-medium mt-2 truncate">{item.title}</p>
                  {item.body && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.body}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <Button variant="outline" size="sm" className="touch-manipulation" asChild>
                    <Link href={`${base}/content/${item.id}`}>View</Link>
                  </Button>
                  <Button size="sm" className="touch-manipulation" asChild>
                    <Link href={`${base}/content/${item.id}/edit`}>Edit post</Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <AddContentLink pageId={page.id} channelSlug={channelSlug} label="+ Add content to this page" />
      </section>

      <section
        className="rounded-xl border-2 border-primary/25 bg-primary/5 p-6 shadow-sm"
        aria-labelledby="edit-page-heading"
      >
        <h2 id="edit-page-heading" className="text-lg font-semibold mb-2">
          Page settings
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Update how this page appears in the sidebar and at the top of the page. Your saved values are
          summarized below—edit the fields to change them.
        </p>

        {/* Read-only snapshot of what is currently saved (visitors see this) */}
        <div className="rounded-lg border border-border bg-background/90 p-4 sm:p-5 mb-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Currently saved on this page
          </p>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground text-xs font-medium mb-0.5">Title</dt>
              <dd className="font-medium text-foreground">{page.title}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs font-medium mb-0.5">Public URL</dt>
              <dd>
                <span className="font-mono text-foreground break-all">{publicUrl}</span>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs font-medium mb-0.5">Page intro</dt>
              <dd className="text-foreground whitespace-pre-wrap">
                {page.description?.trim()
                  ? page.description
                  : "— No intro yet — visitors only see the title until you add one below."}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs font-medium mb-0.5">Sort order</dt>
              <dd className="font-mono tabular-nums">{page.sort_order ?? 0}</dd>
            </div>
            {savedAt && (
              <div>
                <dt className="text-muted-foreground text-xs font-medium mb-0.5">Last saved</dt>
                <dd className="text-muted-foreground">{savedAt}</dd>
              </div>
            )}
          </dl>
        </div>

        <form key={formKey} action={formAction} className="space-y-5 max-w-2xl">
          <input type="hidden" name="channel_id" value={channelId} />
          <input type="hidden" name="page_id" value={page.id} />

          <div>
            <label htmlFor="page-title" className="block text-sm font-medium mb-1">
              Page title
            </label>
            <input
              id="page-title"
              name="title"
              type="text"
              required
              defaultValue={page.title}
              className="w-full min-h-11 rounded-xl border border-input bg-background px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label htmlFor="page-description" className="block text-sm font-medium mb-1">
              Page intro (optional)
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Shown at the top of this page above your posts. Use it for a short note or welcome message.
            </p>
            <textarea
              id="page-description"
              name="description"
              rows={4}
              defaultValue={page.description ?? ""}
              className="w-full min-h-[6rem] rounded-xl border border-input bg-background px-4 py-3 text-sm resize-y"
              placeholder="Optional text for visitors…"
            />
          </div>

          <div>
            <label htmlFor="page-sort" className="block text-sm font-medium mb-1">
              Sort order
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Lower numbers appear earlier in the page list (sidebar). Home can use 0.
            </p>
            <input
              id="page-sort"
              name="sort_order"
              type="number"
              inputMode="numeric"
              defaultValue={page.sort_order ?? 0}
              className="w-full max-w-[12rem] min-h-11 rounded-xl border border-input bg-background px-4 py-3 text-sm"
            />
          </div>

          {!isHome && (
            <div>
              <label htmlFor="page-slug" className="block text-sm font-medium mb-1">
                URL segment
              </label>
              <p className="text-xs text-muted-foreground mb-2 break-all">
                Page URL: <span className="font-mono">{base}/</span>
                <span className="font-mono text-foreground">{page.slug}</span>
              </p>
              <input
                id="page-slug"
                name="slug"
                type="text"
                required
                defaultValue={page.slug}
                className="w-full min-h-11 rounded-xl border border-input bg-background px-4 py-3 text-sm font-mono"
                autoComplete="off"
              />
            </div>
          )}

          {isHome && (
            <p className="text-sm text-muted-foreground rounded-lg border border-dashed border-border bg-background/60 px-3 py-2">
              The home page always lives at <span className="font-mono">{base}</span>. You can change the title,
              intro, and sort order; the URL cannot be changed.
            </p>
          )}

          {state?.error && (
            <p className="text-destructive text-sm" role="alert">
              {state.error}
            </p>
          )}

          <div className="flex flex-col gap-3 pt-2">
            <Button
              type="submit"
              disabled={pending}
              className="w-full min-h-11 touch-manipulation bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {pending ? "Saving…" : "Save changes"}
            </Button>
            <Button type="button" variant="outline" className="w-full min-h-11 touch-manipulation" asChild>
              <Link href={isHome ? base : `${base}/${page.slug}`}>Cancel</Link>
            </Button>
          </div>
        </form>
      </section>

      {!isHome && (
        <PageDeleteForm channelId={channelId} pageId={page.id} pageTitle={page.title} />
      )}
    </div>
  );
}
