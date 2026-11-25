import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions";
import { listMyShorts } from "@/actions/shorts";
import { MyShortRow } from "@/components/shorts/my-short-row";
import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata("My shorts");
export const dynamic = "force-dynamic";

export default async function MyShortsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?next=/shorts/mine");
  const shorts = await listMyShorts();
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="btw-page-title">My shorts</h1>
        <Link href="/shorts/new" className="text-sm font-medium text-primary hover:underline">
          Share a short
        </Link>
      </div>
      {shorts.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          You haven&apos;t shared a short yet.
        </p>
      ) : (
        <ul className="divide-y divide-border/70 rounded-2xl border border-border bg-card">
          {shorts.map((s) => (
            <MyShortRow key={s.id} short={s} />
          ))}
        </ul>
      )}
    </div>
  );
}
