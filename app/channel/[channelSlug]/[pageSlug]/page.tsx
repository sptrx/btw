import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getChannelBySlug,
  getChannelPages,
  getChannelPage,
  getPageContent,
  isChannelAuthor,
} from "@/actions/channels";
import { getCurrentUser } from "@/actions";
import AddPageLink from "../add-page-link";
import AddContentLink from "../add-content-link";

type Props = { params: Promise<{ channelSlug: string; pageSlug: string }> };

export default async function ChannelSubPage({ params }: Props) {
  const { channelSlug, pageSlug } = await params;

  const [channel, user] = await Promise.all([
    getChannelBySlug(channelSlug),
    getCurrentUser(),
  ]);

  if (!channel) notFound();

  const [pages, page] = await Promise.all([
    getChannelPages(channel.id),
    getChannelPage(channel.id, pageSlug),
  ]);

  if (!page) notFound();

  const [content, isAuthor] = await Promise.all([
    getPageContent(channel.id, page.id),
    isChannelAuthor(channel.id),
  ]);

  const typeLabels: Record<string, string> = {
    video: "Video",
    podcast: "Podcast",
    article: "Article",
    discussion: "Discussion",
  };

  return (
    <div>
      <div className="border rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold">{page.title}</h1>

        <nav className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/channel/${channelSlug}`}
            className="px-3 py-1 border rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Home
          </Link>
          {pages
            .filter((p) => p.slug !== "home")
            .map((p) => (
              <Link
                key={p.id}
                href={`/channel/${channelSlug}/${p.slug}`}
                className={`px-3 py-1 rounded ${
                  p.slug === pageSlug
                    ? "bg-indigo-100 dark:bg-indigo-900/50 font-medium"
                    : "border hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {p.title}
              </Link>
            ))}
          {isAuthor && (
            <>
              <AddPageLink channelId={channel.id} channelSlug={channelSlug} />
              <AddContentLink channelId={channel.id} pageId={page.id} channelSlug={channelSlug} />
            </>
          )}
        </nav>
      </div>

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
