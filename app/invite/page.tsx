import type { Metadata } from "next";
import Link from "next/link";
import { btwDisplayFont } from "@/lib/btw-ui";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Invite",
  description:
    "Give your church or ministry a channel on Believe The Works to share sermons, testimonies, and encouragement with a wider community.",
};

const WHAT_TO_SHARE = [
  {
    title: "Sermon clips and teaching",
    body: "Post a video or podcast your ministry already has, or a short written takeaway from Sunday.",
  },
  {
    title: "Member testimonies",
    body: "A few honest sentences about what God has done is often the most-read thing on a channel.",
  },
  {
    title: "Devotionals",
    body: "Scripture with a short reflection and application, ready to share and pass along.",
  },
  {
    title: "Discussion and questions",
    body: "Open a conversation for your community, moderated for safety before it goes live.",
  },
] as const;

const STEPS = [
  {
    title: "Create an account",
    body: "Sign up and choose the channel author role so you can create and manage a channel.",
  },
  {
    title: "Set up your channel",
    body: "Name it for your church or ministry, add a short description, and add pages such as Sermons, Testimonies, or Devotionals.",
  },
  {
    title: "Post your first few things",
    body: "Start with two or three pieces you already have. Use the writing prompts on the new-post form if you want a starting point.",
  },
  {
    title: "Invite your people",
    body: "Share your channel link with your congregation and ask a few members to add a short testimony.",
  },
] as const;

const FAQ = [
  {
    q: "Who owns what we post?",
    a: "You do. You choose what to publish and can edit or delete your posts. Only post what you have the right to share: your own sermons, writing and testimonies, or material you have permission to use.",
  },
  {
    q: "How is content moderated?",
    a: "Every post and comment is checked by AI for safety and mission fit before it appears. Some posts may be held for review. See the community guidelines for what belongs here.",
  },
  {
    q: "Do our members need accounts?",
    a: "Anyone can read channels without an account. Members need a free account to comment, pray with others, or share their own story.",
  },
  {
    q: "We are a small ministry. Is this for us?",
    a: "Yes. A channel can be as simple as one testimony a week. There is no minimum size or posting schedule.",
  },
] as const;

export default function InvitePage() {
  return (
    <div className="max-w-3xl space-y-12 pb-4">
      <header className="space-y-3">
        <p className="btw-overline">For churches and ministries</p>
        <h1 className="btw-page-title">Bring your church&apos;s witness to a wider community</h1>
        <p className="btw-lead">
          Believe The Works is a place to share what God is doing through testimony, teaching, and
          encouragement. We are inviting churches and ministries to start the first channels and
          help shape the community.
        </p>
        <p className="flex flex-wrap gap-4 pt-1 text-sm font-medium">
          <Link
            href="/auth/signup"
            className="inline-flex min-h-11 items-center rounded-full bg-primary px-6 text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Create your channel
          </Link>
          <Link
            href="/contact"
            className="inline-flex min-h-11 items-center rounded-full border border-border px-6 text-foreground transition-colors hover:bg-muted/50"
          >
            Talk with us first
          </Link>
        </p>
      </header>

      <section className="space-y-4" aria-labelledby="invite-share-heading">
        <h2 id="invite-share-heading" className="btw-section-title">
          What your ministry can share
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {WHAT_TO_SHARE.map((item) => (
            <li key={item.title} className="rounded-2xl border border-border/70 bg-card p-4">
              <h3 className={cn(btwDisplayFont, "text-lg font-normal text-foreground")}>
                {item.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4" aria-labelledby="invite-steps-heading">
        <h2 id="invite-steps-heading" className="btw-section-title">
          Getting started
        </h2>
        <ol className="space-y-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-4">
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted/40 text-sm font-medium tabular-nums"
                aria-hidden
              >
                {i + 1}
              </span>
              <div>
                <h3 className="font-medium text-foreground">{step.title}</h3>
                <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-3" aria-labelledby="invite-week-heading">
        <h2 id="invite-week-heading" className="btw-section-title">
          A simple first week
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>Post one recent sermon clip or a short written takeaway from it.</li>
          <li>Ask three to five members to share a two-minute testimony or a few sentences.</li>
          <li>Ask your prayer team to add a couple of requests to the prayer wall.</li>
          <li>Announce your channel link from the pulpit, the bulletin, or your group chat.</li>
        </ul>
      </section>

      <section className="space-y-4" aria-labelledby="invite-faq-heading">
        <h2 id="invite-faq-heading" className="btw-section-title">
          Questions
        </h2>
        <dl className="space-y-4">
          {FAQ.map((item) => (
            <div key={item.q}>
              <dt className="font-medium text-foreground">{item.q}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.a}</dd>
            </div>
          ))}
        </dl>
        <p className="text-sm text-muted-foreground">
          Read the{" "}
          <Link href="/legal/community-guidelines" className="text-primary hover:underline">
            community guidelines
          </Link>{" "}
          and{" "}
          <Link href="/legal/terms" className="text-primary hover:underline">
            terms
          </Link>
          , or{" "}
          <Link href="/contact" className="text-primary hover:underline">
            contact us
          </Link>{" "}
          with any question.
        </p>
      </section>
    </div>
  );
}
