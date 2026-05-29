import Link from "next/link";
import { ExternalLink, MapPin, Church, Calendar } from "lucide-react";
import type { ProfilePublicFields } from "@/lib/profile-fields";
import { websiteLinkLabel } from "@/lib/profile-fields";
import { UserAvatar } from "@/components/user-avatar";
import { FollowUserButton } from "@/components/follow-user-button";
import { profilePath } from "@/lib/profile-url";
import { format } from "date-fns";

type Props = {
  profile: ProfilePublicFields;
  showEditLink?: boolean;
  followerCount?: number;
  followingCount?: number;
  showFollowButton?: boolean;
  initialFollowing?: boolean;
  isAuthenticated?: boolean;
  isOwnProfile?: boolean;
};

export function ProfileHeader({
  profile,
  showEditLink = false,
  followerCount = 0,
  followingCount = 0,
  showFollowButton = false,
  initialFollowing = false,
  isAuthenticated = false,
  isOwnProfile = false,
}: Props) {
  const displayName = profile.display_name?.trim() || "Anonymous";
  const joinLabel =
    profile.created_at &&
    format(new Date(profile.created_at), "MMMM yyyy");

  return (
    <div className="btw-content-panel">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <UserAvatar
          name={displayName}
          avatarUrl={profile.avatar_url}
          size="xl"
          className="ring-2 ring-border/60"
        />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="btw-page-title-sm">{displayName}</h1>
              {profile.username ? (
                <p className="mt-0.5 text-sm text-muted-foreground">@{profile.username}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {showFollowButton && !isOwnProfile ? (
                <FollowUserButton
                  userId={profile.id}
                  displayName={displayName}
                  initialFollowing={initialFollowing}
                  isAuthenticated={isAuthenticated}
                  loginNext={profilePath(profile)}
                />
              ) : null}
              {showEditLink ? (
                <Link
                  href="/dashboard/settings"
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Edit profile
                </Link>
              ) : null}
            </div>
          </div>

          <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
            <div>
              <dt className="sr-only">Followers</dt>
              <dd>
                <span className="font-semibold text-foreground tabular-nums">
                  {followerCount}
                </span>{" "}
                <span className="text-muted-foreground">followers</span>
              </dd>
            </div>
            <div>
              <dt className="sr-only">Following</dt>
              <dd>
                <span className="font-semibold text-foreground tabular-nums">
                  {followingCount}
                </span>{" "}
                <span className="text-muted-foreground">following</span>
              </dd>
            </div>
          </dl>

          {(profile.city || profile.ministry_name || joinLabel) && (
            <dl className="flex flex-col gap-1.5 text-sm text-muted-foreground">
              {joinLabel ? (
                <div className="flex items-center gap-2">
                  <dt className="sr-only">Joined</dt>
                  <Calendar className="size-4 shrink-0 text-muted-foreground/80" aria-hidden />
                  <dd>Joined {joinLabel}</dd>
                </div>
              ) : null}
              {profile.city ? (
                <div className="flex items-center gap-2">
                  <dt className="sr-only">Location</dt>
                  <MapPin className="size-4 shrink-0 text-muted-foreground/80" aria-hidden />
                  <dd>{profile.city}</dd>
                </div>
              ) : null}
              {profile.ministry_name ? (
                <div className="flex items-center gap-2">
                  <dt className="sr-only">Ministry or church</dt>
                  <Church className="size-4 shrink-0 text-muted-foreground/80" aria-hidden />
                  <dd>{profile.ministry_name}</dd>
                </div>
              ) : null}
            </dl>
          )}

          {profile.profile_private ? (
            <p className="text-xs font-medium text-muted-foreground rounded-md border border-border/60 bg-muted/30 px-2 py-1 w-fit">
              Private profile
            </p>
          ) : null}

          {profile.bio ? (
            <p className="whitespace-pre-wrap btw-lead sm:text-base">{profile.bio}</p>
          ) : null}

          {profile.website_url ? (
            <a
              href={profile.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {websiteLinkLabel(profile.website_url)}
              <ExternalLink className="size-3.5 shrink-0" aria-hidden />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
