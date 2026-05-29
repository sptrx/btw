import Link from "next/link";
import type { PeopleYouMayKnowItem } from "@/actions/follows";
import { UserAvatar } from "@/components/user-avatar";
import { FollowUserButton } from "@/components/follow-user-button";
import { profilePath } from "@/lib/profile-url";

type Props = {
  suggestions: PeopleYouMayKnowItem[];
  isAuthenticated: boolean;
};

export function PeopleYouMayKnow({ suggestions, isAuthenticated }: Props) {
  if (!suggestions.length) return null;

  return (
    <aside className="rounded-xl border border-border/80 bg-muted/25 p-4 dark:bg-muted/10">
      <h2 className="text-sm font-semibold text-foreground">People you may know</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Others walking with the same channels as you
      </p>
      <ul className="mt-4 space-y-3">
        {suggestions.map((person) => (
          <li key={person.id} className="flex items-start gap-3">
            <Link href={profilePath(person)} className="shrink-0">
              <UserAvatar
                name={person.displayName}
                avatarUrl={person.avatarUrl}
                size="sm"
              />
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={profilePath(person)}
                className="block truncate text-sm font-medium text-foreground hover:text-primary"
              >
                {person.displayName}
              </Link>
              <p className="text-xs text-muted-foreground">
                {person.sharedChannelCount}{" "}
                {person.sharedChannelCount === 1 ? "shared channel" : "shared channels"}
              </p>
              <FollowUserButton
                userId={person.id}
                displayName={person.displayName}
                initialFollowing={false}
                isAuthenticated={isAuthenticated}
                variant="link"
                className="mt-1"
              />
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
