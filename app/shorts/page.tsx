import Link from "next/link";
import { getCurrentUser } from "@/actions";
import { listApprovedShorts } from "@/actions/shorts";
import { ShortsFeed } from "@/components/shorts/shorts-feed";
import { Button } from "@/components/ui/button";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Shorts",
  description: "Short testimonies and encouragement, under 90 seconds.",
  path: "/shorts",
});

export const dynamic = "force-dynamic";

export default async function ShortsPage() {
  const [user, { items, nextCursor }] = await Promise.all([getCurrentUser(), listApprovedShorts()]);
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="btw-page-title">Shorts</h1>
          <p className="mt-1 text-sm text-muted-foreground">Testimony and encouragement in under 90 seconds.</p>
        </div>
        <Button asChild>
          <Link href={user ? "/shorts/new" : "/auth/login?next=/shorts/new"}>Share a short</Link>
        </Button>
      </div>
      <ShortsFeed initial={items} initialCursor={nextCursor} />
    </div>
  );
}
