import { redirect } from "next/navigation";

/** Old topic-content links land on the home feed. */
export default function TopicContentRedirect() {
  redirect("/");
}
