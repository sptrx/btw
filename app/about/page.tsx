import type { Metadata } from "next";
import Link from "next/link";
import { btwDisplayFont } from "@/lib/btw-ui";
import { siteFooterTagline } from "@/lib/site-links";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "About",
  description: "About Believe The Works — AI-powered Gospel outreach and faith community.",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl space-y-8 pb-4">
      <header className="space-y-3">
        <h1 className="btw-page-title">About Believe The Works</h1>
        <p className="btw-lead">{siteFooterTagline}</p>
      </header>

      <section className="space-y-3">
        <h2 className="btw-section-title">Our mission</h2>
        <p className="btw-prose">
          Believe The Works is a nonprofit Gospel outreach ministry. We built this platform so Christians can share
          real testimony—what God has done in their lives—and encourage others when words alone are not enough. John
          10:38 invites people to weigh the works of Christ; we invite you to share yours.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="btw-section-title">AI with purpose</h2>
        <p className="btw-prose">
          Every post is reviewed by AI before it goes live, keeping the community safe and on-mission: testimony, faith,
          and encouragement—not debate or harm. That lets families, churches, and new believers participate with
          confidence.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="btw-section-title">Join us</h2>
        <p className="btw-prose">
          Create a channel, share your witness, and browse what others are posting across the community.
        </p>
        <p className="flex flex-wrap gap-4 text-sm font-medium">
          <Link href="/auth/signup" className="text-primary hover:underline">
            Get started
          </Link>
          <Link href="/donate" className="text-primary hover:underline">
            Support the ministry
          </Link>
          <Link href="/contact" className="text-primary hover:underline">
            Contact us
          </Link>
        </p>
      </section>

      <blockquote
        className={cn(
          btwDisplayFont,
          "border-l-[3px] border-primary/40 pl-4 text-lg text-foreground italic"
        )}
      >
        They triumphed by the blood of the Lamb and by the word of their testimony.
        <footer className="btw-meta mt-2 not-italic">— Revelation 12:11</footer>
      </blockquote>
    </div>
  );
}
