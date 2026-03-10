import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getTopicById, getTopicMembers, isTopicAuthor } from "@/actions/topics";
import { getCurrentUser } from "@/actions";
import ApproveRejectButtons from "./approve-reject-buttons";

type Props = { params: Promise<{ topicId: string }> };

export default async function ManageTopicMembersPage({ params }: Props) {
  const { topicId } = await params;
  const [topic, user] = await Promise.all([
    getTopicById(topicId),
    getCurrentUser(),
  ]);

  if (!topic) notFound();
  if (!user) redirect("/auth/login");

  const author = await isTopicAuthor(topicId);
  if (!author) redirect("/dashboard");

  const [pending, approved] = await Promise.all([
    getTopicMembers(topicId, "pending"),
    getTopicMembers(topicId, "approved"),
  ]);

  return (
    <div>
      <Link
        href={`/topics/${topic.slug}`}
        className="text-sm text-indigo-600 hover:underline mb-4 inline-block"
      >
        ← Back to {topic.title}
      </Link>

      <h1 className="text-2xl font-bold mb-6">Manage members</h1>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Pending requests</h2>
        {pending.length === 0 ? (
          <p className="text-gray-500">No pending requests.</p>
        ) : (
          <ul className="space-y-2">
            {pending.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between border rounded p-3"
              >
                <span>
                  {(m.profiles as { display_name?: string })?.display_name ?? "Anonymous"}
                </span>
                <ApproveRejectButtons topicId={topicId} memberId={m.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Approved members</h2>
        {approved.length === 0 ? (
          <p className="text-gray-500">No approved members yet.</p>
        ) : (
          <ul className="space-y-2">
            {approved.map((m) => (
              <li key={m.id} className="border rounded p-3 flex justify-between">
                <span>
                  {(m.profiles as { display_name?: string })?.display_name ?? "Anonymous"}
                </span>
                <span className="text-sm text-green-600">Approved</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
