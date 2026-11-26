"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { passwordPolicyError } from "@/lib/password-policy";

export async function updatePassword(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "You must be signed in to change your password." };

  // Passwords are used exactly as typed (no trimming — spaces are valid characters).
  const currentPassword = (formData.get("current_password") as string | null) ?? "";
  const newPassword = (formData.get("new_password") as string | null) ?? "";
  const confirmPassword = (formData.get("confirm_password") as string | null) ?? "";

  const policyError = passwordPolicyError(newPassword, "New password");
  if (policyError) return { error: policyError };
  if (newPassword !== confirmPassword) {
    return { error: "New passwords do not match." };
  }

  // Accounts that have a password must confirm it, so a stolen or left-open
  // session can't silently take over the account. OAuth / magic-link-only
  // accounts have no password yet — the session is the proof (same rule as
  // deleteCurrentUser).
  const hasPasswordIdentity = (user.identities ?? []).some((i) => i.provider === "email");
  if (hasPasswordIdentity) {
    if (!currentPassword) {
      return { error: "Please enter your current password." };
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (signInError) {
      return { error: "Current password is incorrect." };
    }
  }

  // Auth is configured to require the current password on the update itself.
  // Verifying with signInWithPassword is not enough; the field has to travel
  // with the new password or Auth returns "Current password required…".
  const { error } = await supabase.auth.updateUser(
    hasPasswordIdentity
      ? { password: newPassword, current_password: currentPassword }
      : { password: newPassword }
  );

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  revalidatePath("/profile");
  return {};
}

export async function signOutAllOtherDevices(): Promise<{ error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase.auth.signOut({ scope: "others" });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  return {};
}

export async function signOutAllDevices() {
  const supabase = await createClient();

  await supabase.auth.signOut({ scope: "global" });
  revalidatePath("/", "layout");
  redirect("/auth/login?message=signed_out_all");
}

/**
 * GDPR delete-my-account. Calls the `public.delete_current_user()`
 * SECURITY DEFINER RPC, which removes the row in `auth.users` for the caller;
 * cascades clean up profile / posts / comments / notifications / etc.
 *
 * For email/password accounts we re-verify the password first. OAuth and
 * magic-link accounts have no password — the active session is proof of
 * identity, matching the password-change and email-change flows.
 *
 * After deletion we sign out (so the now-invalid cookies aren't sent on the
 * next request) and redirect to the public landing page. Returns an `{error}`
 * shape only on the validation step — once the RPC succeeds the redirect runs.
 */
export async function deleteCurrentUser(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const confirmText = (formData.get("confirm_text") as string | null)?.trim() ?? "";
  if (confirmText !== "DELETE") {
    return { error: "Please type DELETE to confirm." };
  }

  // Detect password-based identity. OAuth-only users have no `email` provider
  // and shouldn't be forced to type a password they never set.
  const hasPasswordIdentity = (user.identities ?? []).some(
    (i) => i.provider === "email"
  );
  const currentPassword = (formData.get("current_password") as string | null)?.trim() ?? "";

  if (hasPasswordIdentity) {
    if (!currentPassword) {
      return { error: "Please enter your current password to confirm." };
    }
    if (!user.email) {
      return { error: "Account is missing an email; can't verify password." };
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (signInError) {
      return { error: "Current password is incorrect." };
    }
  }

  const { error: rpcError } = await supabase.rpc("delete_current_user");
  if (rpcError) {
    return { error: rpcError.message };
  }

  // The auth row is gone, but the session cookies still exist until we sign
  // out — without this, subsequent requests carry stale tokens that resolve to
  // a nonexistent user (= confusing 500s in middleware).
  await supabase.auth.signOut({ scope: "global" });
  revalidatePath("/", "layout");
  redirect("/auth/login?message=account_deleted");
}
