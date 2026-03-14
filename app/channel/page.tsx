import { Metadata } from "next";
import Link from "next/link";
import { fetchChannels } from "@/actions/channels";
import { getCurrentUser } from "@/actions";

export const metadata: Metadata = {
  title: "Channels",
  description: "Browse faith-based channels",
};

export default async function ChannelsPage() {
  const [channels, user] = await Promise.all([fetchChannels(), getCurrentUser()]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Channels</h1>
        {user && (
          <Link
            href="/channel/new"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Create channel
          </Link>
        )}
      </div>

      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Explore channels with videos, podcasts, articles, and discussions. Sign up to leave feedback and comments.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {channels.map((ch) => {
          const author = ch.profiles as { display_name?: string } | null;
          return (
            <Link
              key={ch.id}
              href={`/channel/${ch.slug}`}
              className="block border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              <h2 className="font-semibold text-lg">{ch.title}</h2>
              {ch.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                  {ch.description}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-2">by {author?.display_name ?? "Anonymous"}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
