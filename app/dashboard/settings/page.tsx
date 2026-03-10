import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProfile, getCurrentUser } from "@/actions";
import ProfileSettingsForm from "./profile-settings-form";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your BTW account settings",
};

export default async function Settings() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const profile = await getProfile(user.id);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <ProfileSettingsForm
        displayName={profile?.display_name ?? ""}
        bio={profile?.bio ?? ""}
      />
    </div>
  );
}
