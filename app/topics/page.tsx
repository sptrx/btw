import { redirect } from "next/navigation";

/** Old topic links now open the channel list. */
export default function TopicsRedirect() {
  redirect("/channel/browse");
}
