import { redirect } from "next/navigation";

export default function NewTopicRedirect() {
  redirect("/channel/new");
}
