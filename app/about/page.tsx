import type { Metadata } from "next";
import Link from "next/link";
import { btwDisplayFont } from "@/lib/btw-ui";
import { siteFooterTagline } from "@/lib/site-links";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "About",
  description:
    "Believe The Works — a welcoming place for believers to share testimony and for anyone to explore Christianity safely.",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl space-y-10 pb-4">
      <header className="space-y-3">
        <h1 className="btw-page-title">About Believe The Works</h1>
        <p className="btw-lead">{siteFooterTagline}</p>
      </header>

      <section className="space-y-3">
        <h2 className="btw-section-title">For believers</h2>
        <p className="btw-prose">
          Join a global community of faith where you can share what God has done in your life —
          your testimony — through posts, photos, podcasts, or video on your own channel. Encourage
          others, follow channels you care about, and take part in prayer and praise alongside
          believers around the world.
        </p>
        <p className="btw-prose">
          John 10:38 invites people to weigh the works of Christ when words alone are hard to
          accept. We built BTW so your story of God&apos;s work can reach someone who needs hope
          today.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="btw-section-title">For anyone exploring</h2>
        <p className="btw-prose">
          You do not need to be a Christian to be here. If you are curious, skeptical, or visiting
          because a friend shared a story, you are welcome. Explore Christianity in a safe,
          welcoming space: read real testimonies, ask Bible questions without pressure, and learn at
          your own pace.
        </p>
        <p className="flex flex-wrap gap-4 text-sm font-medium">
          <Link href="/explore" className="text-primary hover:underline">
            Start exploring
          </Link>
          <Link href="/ask" className="text-primary hover:underline">
            Ask a Bible question
          </Link>
          <Link href="/feed?filter=testimonies" className="text-primary hover:underline">
            Read testimonies
          </Link>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="btw-section-title">Safe, thoughtful community</h2>
        <p className="btw-prose">
          Every post is reviewed by AI before it goes live, keeping conversations respectful and
          on-mission — testimony, faith, and encouragement rather than harm or endless debate.
          Families, churches, and new visitors can participate with confidence.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="btw-section-title">Take a next step</h2>
        <p className="btw-prose">
          Create a free account when you are ready — to save questions, follow stories, or share your
          own witness. There is no rush.
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
          "border-l-[3px] border-primary/40 pl-4 text-lg text-foreground italic",
        )}
      >
        They triumphed by the blood of the Lamb and by the word of their testimony.
        <footer className="btw-meta mt-2 not-italic">— Revelation 12:11</footer>
      </blockquote>
    </div>
  );
}
