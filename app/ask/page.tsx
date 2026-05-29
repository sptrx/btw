import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/actions";
import { AnonymousBibleAskForm } from "@/components/anonymous-bible-ask-form";
import { Button } from "@/components/ui/button";
import { isScriptureGuideConfigured } from "@/lib/bible-ai";
import { bibleAiSsoPath } from "@/lib/bible-ai-config";
import { btwDisplayFont } from "@/lib/btw-ui";
import { OUTREACH_COMMON_QUESTIONS } from "@/lib/outreach-content";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Bible Q&A",
  description:
    "Ask questions about the Bible and get thoughtful, Scripture-grounded answers — no account required to start.",
};

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function AskPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const initialQuestion = typeof q === "string" ? decodeURIComponent(q) : "";
  const user = await getCurrentUser();
  const configured = isScriptureGuideConfigured();

  return (
    <div className="max-w-2xl mx-auto pb-10">
      <header className="space-y-3 mb-8">
        <p className="btw-section-eyebrow">Bible Q&A</p>
        <h1 className={cn(btwDisplayFont, "btw-page-title")}>Ask a Bible question</h1>
        <p className="btw-lead">
          Honest questions welcome. Explore what Scripture says — at your pace, without pressure.
        </p>
      </header>

      {!configured ? (
        <p className="rounded-xl border border-border/80 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Bible Q&A is temporarily unavailable. Please try again later or{" "}
          <Link href="/explore" className="text-primary hover:underline">
            explore testimonies
          </Link>{" "}
          in the meantime.
        </p>
      ) : (
        <>
          {user ? (
            <div className="mb-6 rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm">
              <p>
                You are signed in. For saved conversations and the full Q&A experience, open{" "}
                <Link href={bibleAiSsoPath("/ask")} className="font-medium text-primary hover:underline">
                  Bible Q&A on xgesis.ai
                </Link>
                .
              </p>
            </div>
          ) : null}

          <AnonymousBibleAskForm initialQuestion={initialQuestion} />

          <section className="mt-10" aria-labelledby="ask-starters-heading">
            <h2 id="ask-starters-heading" className="text-sm font-medium text-muted-foreground">
              Not sure what to ask? Try one of these:
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {OUTREACH_COMMON_QUESTIONS.map((item) => (
                <li key={item.id}>
                  <Button asChild variant="outline" size="sm" className="rounded-full h-auto py-1.5">
                    <Link href={`/ask?q=${encodeURIComponent(item.prompt)}`}>{item.label}</Link>
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <p className="mt-10 text-center text-sm text-muted-foreground">
        <Link href="/explore" className="text-primary hover:underline">
          ← Back to Explore
        </Link>
      </p>
    </div>
  );
}
