import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { authPrimaryButtonClass } from "@/lib/auth-form-styles";

export const metadata: Metadata = {
  title: "Email updated",
};

export default async function EmailChangedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email ?? null;

  return (
    <div className="max-w-md mx-auto mt-12 sm:mt-20">
      <div className="btw-auth-panel space-y-4 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Email updated</h1>
        {email ? (
          <p className="text-foreground text-sm leading-relaxed text-pretty">
            Your account email is now{" "}
            <span className="font-medium break-all">{email}</span>. Use this address the next
            time you sign in.
          </p>
        ) : (
          <p className="text-foreground text-sm leading-relaxed text-pretty">
            Your account email was updated. Sign in with your new address to continue.
          </p>
        )}
        <p className="text-muted-foreground text-sm">
          If both the old and new address need to be confirmed, your change won&apos;t take
          effect until the second verification link is opened too.
        </p>
        <Link
          href="/dashboard/settings"
          className={authPrimaryButtonClass + " inline-block text-center"}
        >
          Back to settings
        </Link>
        <p className="text-sm text-muted-foreground pt-2">
          <Link href="/" className="text-primary font-medium hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
