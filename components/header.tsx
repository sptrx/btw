import { unstable_rethrow } from "next/navigation";
import { getCurrentUser, getProfile } from "@/actions";
import { HeaderContent } from "@/components/header-content";

export default async function Header() {
  try {
    const user = await getCurrentUser();
    const profile = user ? await getProfile(user.id) : null;
    const isChannelAuthor = profile?.role === "channel_author";
    return <HeaderContent user={user} isChannelAuthor={isChannelAuthor} />;
  } catch (e) {
    unstable_rethrow(e);
    console.error("[header] auth/profile:", e);
    return <HeaderContent user={null} isChannelAuthor={false} />;
  }
}
