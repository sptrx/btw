import Link from "next/link";
import { Check } from "lucide-react";
import type { AuthorSetupChannel } from "@/actions/dashboard";
import { cn } from "@/lib/utils";

type Props = {
  channels: AuthorSetupChannel[];
};

const STEPS = [
  {
    key: "hasBanner" as const,
    title: "Add a banner",
    href: (slug: string) => `/channel/${slug}/settings#banner`,
  },
  {
    key: "hasDescription" as const,
    title: "Write a description",
    href: (slug: string) => `/channel/${slug}/settings#description`,
  },
  {
    key: "hasPost" as const,
    title: "Post your first testimony",
    href: (slug: string) => `/channel/${slug}/content/new`,
  },
];

function progressOf(channel: AuthorSetupChannel): number {
  return STEPS.filter((step) => channel[step.key]).length;
}

export function AuthorSetupChecklist({ channels }: Props) {
  if (channels.length === 0) {
    return (
      <section className="mb-8 rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm sm:p-6">
        <p className="btw-overline text-primary">Your channel</p>
        <h2 className="btw-section-title mt-1">Start with three small steps</h2>
        <ol className="mt-4 space-y-2 text-sm">
          <li>
            <Link href="/channel/new" className="font-medium text-primary hover:underline">
              Create your channel
            </Link>
          </li>
          <li className="text-muted-foreground">Add a banner and a short description</li>
          <li className="text-muted-foreground">Post your first testimony</li>
        </ol>
      </section>
    );
  }

  const ordered = [...channels].sort((a, b) => progressOf(a) - progressOf(b));
  const shown = ordered.slice(0, 2);

  return (
    <section className="mb-8 space-y-4">
      {shown.map((channel) => {
        const done = progressOf(channel);
        const complete = done === STEPS.length;
        return (
          <div
            key={channel.slug}
            className="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm sm:p-6"
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="btw-overline text-primary">Channel setup</p>
                <h2 className="btw-section-title mt-1">{channel.title}</h2>
              </div>
              <p className="text-sm tabular-nums text-muted-foreground">
                {done} of {STEPS.length}
              </p>
            </div>
            <div
              className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={done}
              aria-valuemin={0}
              aria-valuemax={STEPS.length}
              aria-label={`${channel.title} setup`}
            >
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${(done / STEPS.length) * 100}%` }}
              />
            </div>
            {complete ? (
              <p className="mt-4 text-sm text-muted-foreground">
                This channel is ready to share.{" "}
                <Link
                  href={`/channel/${channel.slug}`}
                  className="font-medium text-primary hover:underline"
                >
                  Open {channel.title}
                </Link>
              </p>
            ) : (
              <ol className="mt-4 space-y-2">
                {STEPS.map((step) => {
                  const checked = channel[step.key];
                  return (
                    <li key={step.key}>
                      <Link
                        href={step.href(channel.slug)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-2 py-2 text-sm hover:bg-muted/60",
                          checked ? "text-muted-foreground" : "text-foreground"
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-6 shrink-0 items-center justify-center rounded-full border",
                            checked
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border"
                          )}
                          aria-hidden
                        >
                          {checked ? <Check className="size-3.5" /> : null}
                        </span>
                        <span className={checked ? "line-through" : "font-medium"}>{step.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        );
      })}
    </section>
  );
}
