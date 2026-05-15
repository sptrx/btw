import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, Hash, MessageCircle } from "lucide-react";
import { getCurrentUser } from "@/actions";
import { getDashboardOverview, type RecentCommentRow } from "@/actions/dashboard";
import { RelativeDate } from "@/components/relative-date";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your BTW dashboard",
};

type StatTile = {
  label: string;
  value: number;
  Icon: typeof Hash;
};

export default async function Dashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const overview = await getDashboardOverview(user.id);

  const stats: StatTile[] = [
    { label: "Channels", value: overview.channelCount, Icon: Hash },
    { label: "Posts", value: overview.postCount, Icon: FileText },
    {
      label: "Comments received",
      value: overview.commentsReceivedCount,
      Icon: MessageCircle,
    },
  ];

  return (
    <div>
      <p className="btw-section-eyebrow">Account</p>
      <h1 className="btw-page-title">Dashboard</h1>
      <p className="mb-8 mt-2 text-muted-foreground">
        Welcome back, {user.email?.split("@")[0] ?? "there"}.
      </p>

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.map(({ label, value, Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
              >
                <Icon className="size-4" />
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:text-xs">
                {label}
              </span>
            </div>
            <div className="mt-4 text-3xl font-semibold tabular-nums text-foreground sm:text-4xl">
              {value}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <Link href="/channel/browse" className="btw-app-row font-medium">
          Browse channels
        </Link>
        <Link href="/channel/new" className="btw-app-row font-medium">
          Create a channel
        </Link>
        <Link href="/profile" className="btw-app-row font-medium">
          View your profile
        </Link>
        <Link href="/dashboard/settings" className="btw-app-row font-medium">
          Settings
        </Link>
      </div>

      <RecentCommentsSection comments={overview.recentComments} />
    </div>
  );
}

function RecentCommentsSection({ comments }: { comments: RecentCommentRow[] }) {
  return (
    <section
      aria-labelledby="dashboard-recent-comments"
      className="mt-10 rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-sm sm:p-6"
    >
      <h2
        id="dashboard-recent-comments"
        className="text-lg font-semibold text-foreground"
      >
        Recent comments on your content
      </h2>

      {comments.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No comments yet — share your work to start a conversation.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-border/70">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
              <span
                aria-hidden
                className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted text-sm font-medium text-muted-foreground"
              >
                {c.commenterName.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">
                  {c.commenterName}
                </div>
                <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                  {c.snippet}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
                  <RelativeDate date={c.createdAt} className="tabular-nums" />
                  <span aria-hidden>·</span>
                  <span className="truncate">
                    On{" "}
                    <Link
                      href={`/channel/${c.channelSlug}/content/${c.postId}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {c.postTitle}
                    </Link>
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
