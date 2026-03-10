import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions";
import CreateTopicForm from "./create-topic-form";

export const metadata: Metadata = {
  title: "Create Topic",
  description: "Create a new topic channel",
};

export default async function NewTopicPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Create a topic channel</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Build your channel with articles, tutorials, debates, images, and videos. Users must request
        to join before they can comment, give feedback, or share.
      </p>
      <CreateTopicForm />
    </div>
  );
}
