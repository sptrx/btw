import Link from "next/link";
import { ArrowRight, Layout, Megaphone, Video } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  isLoggedIn: boolean;
  channelSlug?: string | null;
  className?: string;
};

export function SharePrompt({ isLoggedIn, channelSlug, className }: Props) {
  const startHref = isLoggedIn ? "/channel/new" : "/auth/signup";
  const pageHref = channelSlug ? `/channel/${channelSlug}/pages/new` : startHref;
  const videoHref = channelSlug ? `/channel/${channelSlug}/content/new` : startHref;

  const actions = channelSlug
    ? [
        {
          href: `/channel/${channelSlug}`,
          title: "Open your channel",
          detail: "Your place for stories and gatherings.",
          icon: Megaphone,
        },
        {
          href: pageHref,
          title: "Build a page",
          detail: "A page for a series, a ministry, or an event.",
          icon: Layout,
        },
        {
          href: videoHref,
          title: "Upload a video",
          detail: "A speech, testimony, prayer meeting, or event.",
          icon: Video,
        },
      ]
    : [
        {
          href: startHref,
          title: "Start your channel",
          detail: "Then add a page and upload a video.",
          icon: Megaphone,
        },
      ];

  return (
    <section className={cn("rounded-xl border border-border/70 bg-card p-3 shadow-sm", className)}>
      <h2 className="text-sm font-semibold text-foreground">Share what you&apos;ve seen</h2>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        Tell it in your own words. A speech, a testimony, a prayer meeting, or an event can live on your channel as a page or a video.
      </p>
      <ul className="mt-3 space-y-1">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <li key={action.title}>
              <Link
                href={action.href}
                className="flex items-start gap-2 rounded-lg px-1.5 py-2 hover:bg-muted"
              >
                <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span className="min-w-0">
                  <span className="flex items-center gap-1 text-sm font-medium text-foreground">
                    {action.title}
                    <ArrowRight className="size-3.5" aria-hidden />
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                    {action.detail}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      {!channelSlug ? (
        <ul className="mt-2 space-y-1 px-1.5 text-xs leading-relaxed text-muted-foreground">
          <li>Build a page for a series or an event.</li>
          <li>Upload a video of a speech, testimony, or prayer meeting.</li>
        </ul>
      ) : null}
    </section>
  );
}
