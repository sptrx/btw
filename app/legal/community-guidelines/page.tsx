import Link from "next/link";
import type { Metadata } from "next";
import { MISSION_TAGLINE } from "@/lib/moderation-messages";

export const metadata: Metadata = {
  title: "Community guidelines",
  description: "What belongs on Believe The Works — testimony, faith, and encouragement.",
};

export default function CommunityGuidelinesPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="btw-page-title mb-2">Community guidelines</h1>
      <p className="btw-lead mb-2">{MISSION_TAGLINE}</p>
      <p className="btw-lead mb-8">
        Believe The Works exists so Christians can share witness and strengthen one another—not debate politics or
        publish general opinion blogs.
      </p>

      <div className="space-y-8 btw-legal-body">
        <section className="space-y-3">
          <h2 className="btw-section-title">What we encourage</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Personal testimony — what God has done in your life</li>
            <li>Scripture shared with reflection or application from your journey</li>
            <li>Encouragement, prayer requests, and worship reflections</li>
            <li>Faith questions asked respectfully</li>
            <li>Ministry updates tied to witness (not generic marketing)</li>
            <li>Hard seasons shared with trust in God, not primarily blame toward political opponents</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="btw-section-title">What we discourage</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Political campaigns, partisan messaging, or election appeals</li>
            <li>Culture-war hot takes without a testimony angle</li>
            <li>General news commentary, product reviews, or lifestyle posts unrelated to faith</li>
            <li>Debate threads whose main purpose is argument, not witness</li>
            <li>Promotional spam unrelated to ministry or testimony</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="btw-section-title">How moderation works</h2>
          <p>
            Posts and comments are checked by AI for safety and mission fit before or as they appear. Content that is
            clearly off mission may be blocked with guidance on how to revise. Borderline posts may be held for review
            before they appear publicly.
          </p>
          <p>
            Signed-in members can report posts that feel off mission. Reports help us protect the tone of the community.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="btw-section-title">A simple test before you publish</h2>
          <p className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-foreground">
            Ask: <em>Is this mainly my testimony or encouragement in Christ?</em> If the honest answer is no, try
            reframing—or save it for another platform.
          </p>
        </section>
      </div>

      <p className="mt-10 text-sm">
        <Link href="/legal/content-disclaimer" className="text-primary font-medium hover:underline">
          Content disclaimer
        </Link>
        {" · "}
        <Link href="/legal/terms" className="text-muted-foreground hover:underline">
          Terms
        </Link>
        {" · "}
        <Link href="/" className="text-muted-foreground hover:underline">
          Home
        </Link>
      </p>
    </div>
  );
}
