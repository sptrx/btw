export type ProfileRole = "user" | "channel_author" | "moderator";

export function isSiteModerator(role: string | null | undefined): boolean {
  return role === "moderator";
}
