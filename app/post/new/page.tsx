import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser, hasAcceptedContentDisclaimer } from "@/actions";
import { RotatingSlogan } from "@/components/rotating-slogan";
import { WitnessPostForm } from "@/components/witness-post-form";
import { btwDisplayFont, btwLead, btwPageTitle } from "@/lib/btw-ui";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Post it",
  description: "Share a testimony, revelation, prophecy, sermon, discussion, pictures, or a short.",
};

export default async function NewWitnessPostPage() {
  const user = await getCurrentUser();
  const hasDisclaimer = user ? await hasAcceptedContentDisclaimer(user.id) : false;

  return (
    <div className="mx-auto max-w-2xl py-6 sm:py-8">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary hover:underline">
          Home
        </Link>
        <span aria-hidden> / </span>
        <span className="text-foreground">Post it</span>
      </nav>
      <header className="mb-8 space-y-3">
        <RotatingSlogan
          as="h1"
          className={cn(btwPageTitle, btwDisplayFont)}
          supportClassName={cn(btwLead, "mt-2 text-muted-foreground")}
        />
        <p className="text-sm text-muted-foreground">
          Post a topic, pictures, or a short. A free account publishes it after a short review.
        </p>
      </header>
      <WitnessPostForm isAuthenticated={Boolean(user)} hasAlreadyAcceptedDisclaimer={hasDisclaimer} />
    </div>
  );
}
