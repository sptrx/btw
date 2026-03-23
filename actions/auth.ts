"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updatePassword(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "You must be signed in to change your password." };

  const currentPassword = (formData.get("current_password") as string)?.trim();
  const newPassword = (formData.get("new_password") as string)?.trim();
  const confirmPassword = (formData.get("confirm_password") as string)?.trim();

  if (!newPassword || newPassword.length < 6) {
    return { error: "New password must be at least 6 characters." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "New passwords do not match." };
  }

  // Verify current password if provided (email/password users)
  if (currentPassword) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (signInError) {
      return { error: "Current password is incorrect." };
    }
  }
  // OAuth/magic-link users can change password without current password (session is proof)

  const { error } = await supabase.auth.updateUser({ password: newPassword });

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
