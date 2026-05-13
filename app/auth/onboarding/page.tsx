import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { OnboardingRoleForm } from "./role-form";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const existingRole = user.user_metadata?.role as
    | "user"
    | "channel_author"
    | undefined;

  if (existingRole === "user" || existingRole === "channel_author") {
    redirect("/");
  }

  return (
    <div className="max-w-md mx-auto mt-12 sm:mt-20">
      <div className="btw-auth-panel">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">
          One last thing
        </h1>
        <p className="text-muted-foreground text-sm mb-6">
          Choose how you&apos;ll be using Believe The Works.
        </p>
        <OnboardingRoleForm />
      </div>
    </div>
  );
}
