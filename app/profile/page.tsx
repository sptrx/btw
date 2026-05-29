import { redirect } from "next/navigation";
import { getProfile, getCurrentUser } from "@/actions";
import { profilePath } from "@/lib/profile-url";

export default async function Profile() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const profile = await getProfile(user.id);
  if (!profile) redirect("/auth/login");

  redirect(profilePath(profile));
}
