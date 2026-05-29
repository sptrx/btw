import Link from "next/link";
import { getCurrentUser, getProfile, hasAcceptedContentDisclaimer } from "@/actions";
import { PrayerRequestForm } from "@/components/prayer/prayer-request-form";
import { btwDisplayFont, btwLead, btwPageTitle } from "@/lib/btw-ui";
import { cn } from "@/lib/utils";

export default async function NewPrayerRequestPage() {
  const user = await getCurrentUser();
  const [hasDisclaimer, profile] = user
    ? await Promise.all([
        hasAcceptedContentDisclaimer(user.id),
        getProfile(user.id),
      ])
    : [false, null];

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10 sm:px-5 sm:py-12">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/prayer" className="hover:text-primary hover:underline">
          Prayer Wall
        </Link>
        <span aria-hidden> / </span>
        <span className="text-foreground">New request</span>
      </nav>
      <header className="mb-8 space-y-2">
        <h1 className={cn(btwPageTitle, btwDisplayFont)}>Submit a prayer request</h1>
        <p className={cn(btwLead, "text-muted-foreground")}>
          Your request will be reviewed before it appears on the wall. You may post anonymously.
        </p>
      </header>
      <PrayerRequestForm
        hasAlreadyAcceptedDisclaimer={hasDisclaimer}
        defaultCountryCode={profile?.country_code ?? null}
      />
    </div>
  );
}
