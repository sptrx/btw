import { redirect } from "next/navigation";

type PageProps = { searchParams: Promise<{ deleted?: string }> };

/** @deprecated Use /channel — kept for bookmarks and old links */
export default async function MyChannelsRedirect({ searchParams }: PageProps) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  if (sp.deleted === "1") qs.set("deleted", "1");
  const suffix = qs.toString();
  redirect(suffix ? `/channel?${suffix}` : "/channel");
}
