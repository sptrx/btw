/** Public profile path — prefers /u/[username] when available. */

export function profilePath(profile: {
  id: string;
  username?: string | null;
}): string {
  const u = profile.username?.trim();
  if (u) return `/u/${u}`;
  return `/profile/${profile.id}`;
}
