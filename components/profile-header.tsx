import Link from "next/link";
import { ExternalLink, MapPin, Church } from "lucide-react";
import type { ProfilePublicFields } from "@/lib/profile-fields";
import { websiteLinkLabel } from "@/lib/profile-fields";
import { UserAvatar } from "@/components/user-avatar";

type Props = {
  profile: ProfilePublicFields;
  showEditLink?: boolean;
};

export function ProfileHeader({ profile, showEditLink = false }: Props) {
  const displayName = profile.display_name?.trim() || "Anonymous";

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
            <h1 className="btw-page-title text-xl sm:text-2xl">{displayName}</h1>
            {showEditLink ? (
              <Link
                href="/dashboard/settings"
                className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Edit profile
              </Link>
            ) : null}
          </div>

          {(profile.city || profile.ministry_name) && (
            <dl className="flex flex-col gap-1.5 text-sm text-muted-foreground">
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

          {profile.bio ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground sm:text-base">
              {profile.bio}
            </p>
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
