import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProfile, getCurrentUser } from "@/actions";
import ProfileSettingsForm from "./profile-settings-form";
import EmailChangeForm from "./email-change-form";
import PasswordChangeForm from "./password-change-form";
import SessionManagement from "./session-management";
import DeleteAccountForm from "./delete-account-form";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your BTW account settings",
};

export default async function Settings() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const profile = await getProfile(user.id);

  return (
    <div className="space-y-10">
      <div>
        <p className="btw-section-eyebrow">Account</p>
        <h1 className="btw-page-title">Settings</h1>
      </div>

      <section>
        <h2 className="btw-section-title mb-4">Profile</h2>
        <ProfileSettingsForm
          displayName={profile?.display_name ?? ""}
          bio={profile?.bio ?? ""}
          city={profile?.city ?? ""}
          ministryName={profile?.ministry_name ?? ""}
          websiteUrl={profile?.website_url ?? ""}
          avatarUrl={profile?.avatar_url ?? ""}
        />
      </section>

      <section className="border-t border-border pt-6">
        <h2 className="btw-section-title mb-4">Change email</h2>
        <EmailChangeForm currentEmail={user.email ?? ""} />
      </section>

      <section className="border-t border-border pt-6">
        <h2 className="btw-section-title mb-4">Change password</h2>
        <PasswordChangeForm userEmail={user.email ?? ""} />
      </section>

      <section className="border-t border-border pt-6">
        <h2 className="btw-section-title mb-4">Session management</h2>
        <SessionManagement />
      </section>

      <section className="border-t border-destructive/30 pt-6">
        <h2 className="btw-section-title mb-4 text-destructive">Danger zone</h2>
        <DeleteAccountForm userEmail={user.email ?? ""} />
      </section>
    </div>
  );
}
