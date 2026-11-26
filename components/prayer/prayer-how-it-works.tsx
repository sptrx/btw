import { ChevronDown } from "lucide-react";

const STEPS = [
  {
    title: "Ask",
    body: "Share a need in a few sentences. You can post under your name or anonymously.",
  },
  {
    title: "Pray",
    body: "Tap Pray on a request to let the person know someone is standing with them, and leave an encouraging comment if you like.",
  },
  {
    title: "Celebrate",
    body: "When God answers, the author can mark the request as answered and share what happened, and it becomes a Praise Report for everyone.",
  },
];

/** Short explainer for the prayer wall. Open for visitors, collapsed once signed in. */
export function PrayerHowItWorks({ defaultOpen }: { defaultOpen: boolean }) {
  return (
    <details
      open={defaultOpen}
      className="group mb-6 rounded-xl border border-border/80 bg-card/60 shadow-sm"
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-foreground sm:px-5 [&::-webkit-details-marker]:hidden">
        How the prayer wall works
        <ChevronDown
          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="space-y-4 border-t border-border/60 px-4 py-4 sm:px-5">
        <ol className="grid gap-3 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
                  {i + 1}
                </span>
                {s.title}
              </p>
              <p className="text-sm text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
        <p className="text-xs text-muted-foreground">
          Requests are checked by AI moderation before they appear. Please keep comments kind and encouraging.
        </p>
      </div>
    </details>
  );
}
