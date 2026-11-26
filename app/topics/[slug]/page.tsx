import { redirect } from "next/navigation";

export default async function TopicChannelRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/channel/${encodeURIComponent(slug)}`);
}
