import { unstable_rethrow } from "next/navigation";
import { getCurrentUser, getProfile } from "@/actions";
import { userOwnsAnyChannel } from "@/actions/channels";
import { HeaderContent } from "@/components/header-content";

export default async function Header() {
  try {
    const user = await getCurrentUser();
    const profile = user ? await getProfile(user.id) : null;
    const ownsChannels = user ? await userOwnsAnyChannel(user.id) : false;
    const showMyChannels = profile?.role === "channel_author" || ownsChannels;
    return (
      <HeaderContent
        user={user}
        showMyChannels={showMyChannels}
        avatarUrl={profile?.avatar_url}
        profileDisplayName={profile?.display_name}
      />
    );
  } catch (e) {
    unstable_rethrow(e);
    console.error("[header] auth/profile:", e);
    return <HeaderContent user={null} showMyChannels={false} />;
  }
}
