import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { FinishOnboarding } from "./finish-onboarding";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const existingRole = user.user_metadata?.role as string | undefined;
  if (existingRole === "user" || existingRole === "channel_author") {
    redirect("/");
  }

  return (
    <div className="mx-auto mt-12 max-w-md sm:mt-20">
      <div className="btw-auth-panel">
        <h1 className="btw-page-title mb-2">Sign up</h1>
        <FinishOnboarding />
      </div>
    </div>
  );
}
