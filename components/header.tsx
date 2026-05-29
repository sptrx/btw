import { unstable_rethrow } from "next/navigation";
import { getCurrentUser, getProfile } from "@/actions";
import { userOwnsAnyChannel } from "@/actions/channels";
import { HeaderContent } from "@/components/header-content";
import { resolveBibleAiNavLink } from "@/lib/bible-ai-config";
import { isSiteModerator } from "@/lib/site-roles";

export default async function Header() {
  try {
    const user = await getCurrentUser();
    const bibleAiNavLink = resolveBibleAiNavLink(Boolean(user));
    const profile = user ? await getProfile(user.id) : null;
    const ownsChannels = user ? await userOwnsAnyChannel(user.id) : false;
    const showMyChannels = profile?.role === "channel_author" || ownsChannels;
    const showModeration = isSiteModerator(profile?.role);
    return (
      <HeaderContent
        user={user}
        showMyChannels={showMyChannels}
        showModeration={showModeration}
        avatarUrl={profile?.avatar_url}
        profileDisplayName={profile?.display_name}
        bibleAiNavLink={bibleAiNavLink}
      />
    );
  } catch (e) {
    unstable_rethrow(e);
    console.error("[header] auth/profile:", e);
    return (
      <HeaderContent
        user={null}
        showMyChannels={false}
        showModeration={false}
        bibleAiNavLink={resolveBibleAiNavLink(false)}
      />
    );
  }
}
