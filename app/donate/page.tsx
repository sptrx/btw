import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { donateUrl } from "@/lib/site-links";

export const metadata: Metadata = {
  title: "Get involved",
  description: "Support Believe The Works — give to our Gospel outreach ministry.",
};

export default function DonatePage() {
  const externalDonate = donateUrl();

  return (
    <div className="max-w-3xl space-y-8 pb-4">
      <header className="space-y-3">
        <p className="btw-section-eyebrow">Get involved</p>
        <h1 className="btw-page-title">Give to the ministry</h1>
        <p className="btw-lead">
          Believe The Works is a nonprofit organization. Your generosity helps us run AI-powered moderation, hosting,
          and outreach so more people can encounter the Gospel through authentic testimony.
        </p>
      </header>

      <section className="btw-content-panel space-y-4">
        <div className="flex items-start gap-3">
          <Heart className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div className="space-y-2">
            <h2 className="btw-section-title">Ways to support</h2>
            <ul className="btw-prose list-disc space-y-2 pl-5">
              <li>Pray for the team and everyone sharing their witness on the platform.</li>
              <li>Share Believe The Works with your church, small group, or friends online.</li>
              <li>Give financially to cover technology, moderation, and ministry operations.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="btw-section-title">Make a donation</h2>
        {externalDonate ? (
          <p className="btw-prose">
            Use our secure giving page to donate online. Thank you for partnering with us in Gospel outreach.
          </p>
        ) : (
          <p className="btw-prose">
            Online giving will be linked here soon. For now, please{" "}
            <Link href="/contact" className="font-medium text-primary hover:underline">
              contact us
            </Link>{" "}
            and we will send you the best way to give.
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          {externalDonate ? (
            <Button asChild size="lg" className="rounded-full px-8">
              <a href={externalDonate} target="_blank" rel="noopener noreferrer">
                Donate now
                <ArrowRight className="ml-2 size-4" aria-hidden />
              </a>
            </Button>
          ) : null}
          <Button asChild variant="outline" size="lg" className="rounded-full px-8">
            <Link href="/contact">Contact us about giving</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
