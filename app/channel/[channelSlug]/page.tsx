import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getChannelBySlug,
  getChannelPages,
  getPageContent,
  isChannelAuthor,
} from "@/actions/channels";
import { getCurrentUser } from "@/actions";
import AddPageLink from "./add-page-link";
import AddContentLink from "./add-content-link";

type Props = { params: Promise<{ channelSlug: string }> };

export default async function ChannelPage({ params }: Props) {
  const { channelSlug } = await params;

  const [channel, user] = await Promise.all([
    getChannelBySlug(channelSlug),
    getCurrentUser(),
  ]);

  if (!channel) notFound();

  const [pages, homeContent, isAuthor] = await Promise.all([
    getChannelPages(channel.id),
    getPageContent(channel.id, null), // home page has page_id null for legacy, or we get home page id
    isChannelAuthor(channel.id),
  ]);

  const homePage = pages.find((p) => p.slug === "home");
  const content = homePage
    ? await getPageContent(channel.id, homePage.id)
    : homeContent;

  const author = channel.profiles as { display_name?: string } | null;

  const typeLabels: Record<string, string> = {
    video: "Video",
    podcast: "Podcast",
    article: "Article",
    discussion: "Discussion",
  };

  return (
    <div>
      <div className="border rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold">{channel.title}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          by {author?.display_name ?? "Anonymous"}
        </p>
        {channel.description && (
          <p className="mt-3 text-gray-600 dark:text-gray-400">{channel.description}</p>
        )}

        <nav className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/channel/${channelSlug}`}
            className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 rounded font-medium"
          >
            Home
          </Link>
          {pages
            .filter((p) => p.slug !== "home")
            .map((p) => (
              <Link
                key={p.id}
                href={`/channel/${channelSlug}/${p.slug}`}
                className="px-3 py-1 border rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {p.title}
              </Link>
            ))}
          {isAuthor && (
            <>
              <AddPageLink channelId={channel.id} channelSlug={channelSlug} />
              <AddContentLink channelId={channel.id} pageId={homePage?.id} channelSlug={channelSlug} />
            </>
          )}
        </nav>
      </div>

      <h2 className="text-lg font-semibold mb-3">Content</h2>
      <div className="space-y-3">
        {content.length === 0 && (
          <p className="text-gray-500 py-8 text-center">No content yet.</p>
        )}
        {content.map((item) => (
          <Link
            key={item.id}
            href={`/channel/${channelSlug}/content/${item.id}`}
            className="block border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
              {typeLabels[item.type] ?? item.type}
            </span>
            <h3 className="font-medium mt-2">{item.title}</h3>
            {item.body && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                {item.body}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
