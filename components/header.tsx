import { getCurrentUser, getProfile } from "@/actions";
import { HeaderContent } from "@/components/header-content";

export default async function Header() {
  const user = await getCurrentUser();
  const profile = user ? await getProfile(user.id) : null;
  const isChannelAuthor = profile?.role === "channel_author";

  return <HeaderContent user={user} isChannelAuthor={isChannelAuthor} />;
}
