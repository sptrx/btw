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
      <h1 className="text-2xl font-bold text-warm-800 dark:text-warm-100">Settings</h1>

      <section>
        <h2 className="text-lg font-semibold mb-4 text-warm-800 dark:text-warm-100">
          Profile
        </h2>
        <ProfileSettingsForm
          displayName={profile?.display_name ?? ""}
          bio={profile?.bio ?? ""}
        />
      </section>

      <section className="pt-6 border-t border-warm-200 dark:border-warm-700">
        <h2 className="text-lg font-semibold mb-4 text-warm-800 dark:text-warm-100">
          Change email
        </h2>
        <EmailChangeForm currentEmail={user.email ?? ""} />
      </section>

      <section className="pt-6 border-t border-warm-200 dark:border-warm-700">
        <h2 className="text-lg font-semibold mb-4 text-warm-800 dark:text-warm-100">
          Change password
        </h2>
        <PasswordChangeForm userEmail={user.email ?? ""} />
      </section>

      <section className="pt-6 border-t border-warm-200 dark:border-warm-700">
        <h2 className="text-lg font-semibold mb-4 text-warm-800 dark:text-warm-100">
          Session management
        </h2>
        <SessionManagement />
      </section>

      <section className="pt-6 border-t border-terracotta-300 dark:border-terracotta-800">
        <h2 className="text-lg font-semibold mb-4 text-terracotta-700 dark:text-terracotta-300">
          Danger zone
        </h2>
        <DeleteAccountForm userEmail={user.email ?? ""} />
      </section>
    </div>
  );
}
