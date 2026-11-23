import { redirect } from "next/navigation";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  if (filter && filter !== "all") {
    redirect(`/?filter=${encodeURIComponent(filter)}`);
  }
  redirect("/");
}
