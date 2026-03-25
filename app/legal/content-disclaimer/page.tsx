import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Content disclaimer",
  description: "Disclaimer for posts and comments on Believe The Works channels.",
};

export default function ContentDisclaimerPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">Content disclaimer</h1>
      <p className="text-sm text-muted-foreground mb-8">
        This page explains responsibilities when you post or comment on channels.
      </p>

      <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Your responsibility</h2>
          <p>
            You are solely responsible for text, images, audio, video, links, and other material you submit. You confirm
            that you have the rights and permissions needed to share that material and that it does not infringe
            copyright, trademark, privacy, or other rights of any person or entity.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Community and moderation</h2>
          <p>
            Content should be respectful and appropriate for a faith-encouraging community. Operators may remove content,
            hide posts, or restrict accounts that violate guidelines, these terms, or applicable law. Moderation decisions
            are not a substitute for law enforcement where illegal activity is involved.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">No professional advice</h2>
          <p>
            Posts and comments are opinions and experiences of users, not professional advice. Nothing on the Service is
            medical, legal, financial, or therapeutic advice. Always consult qualified professionals for decisions in
            those areas.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Accuracy and third-party links</h2>
          <p>
            We do not verify every statement or link. You use information and external links at your own risk. We are not
            responsible for third-party sites or services.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Indemnity</h2>
          <p>
            To the extent permitted by law, you agree to hold harmless the operators of the Service from claims arising
            from content you submit or your use of posting features, except where prohibited by law.
          </p>
        </section>
      </div>

      <p className="mt-10 text-sm">
        <Link href="/legal/terms" className="text-primary font-medium hover:underline">
          Terms and conditions
        </Link>
        {" · "}
        <Link href="/channel" className="text-muted-foreground hover:underline">
          Channels
        </Link>
        {" · "}
        <Link href="/" className="text-muted-foreground hover:underline">
          Home
        </Link>
      </p>
    </div>
  );
}
