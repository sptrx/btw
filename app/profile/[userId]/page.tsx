import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { profilePath } from "@/lib/profile-url";

type Props = {
  params: Promise<{ userId: string }>;
};

/** Legacy UUID profile URLs redirect to /u/[username]. */
export default async function LegacyUserProfile({ params }: Props) {
  const { userId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("id", userId)
    .maybeSingle();

  if (!data) notFound();
  redirect(profilePath(data));
}
