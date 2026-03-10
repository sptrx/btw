import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTopicBySlug, isTopicAuthor } from "@/actions/topics";
import { getCurrentUser } from "@/actions";
import AddContentForm from "./add-content-form";

type Props = { params: Promise<{ slug: string }> };

export const metadata: Metadata = {
  title: "Add Content",
  description: "Add content to your topic channel",
};

export default async function NewContentPage({ params }: Props) {
  const { slug } = await params;
  const [topic, user] = await Promise.all([getTopicBySlug(slug), getCurrentUser()]);

  if (!topic) notFound();
  if (!user) redirect("/auth/login");

  const isAuthor = await isTopicAuthor(topic.id);
  if (!isAuthor) redirect(`/topics/${slug}`);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Add content to {topic.title}</h1>
      <AddContentForm topicId={topic.id} slug={slug} />
    </div>
  );
}
