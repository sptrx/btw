import type { Metadata } from "next";
import Link from "next/link";
import { authPrimaryButtonClass } from "@/lib/auth-form-styles";

export const metadata: Metadata = {
  title: "Email confirmed",
};

export default function SignupConfirmedPage() {
  return (
    <div className="max-w-md mx-auto mt-12 sm:mt-20">
      <div className="btw-auth-panel space-y-4 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">You&apos;re confirmed</h1>
        <p className="text-muted-foreground text-sm text-pretty">
          Your email has been verified and your BTW account is active. Sign in with the email and password you
          chose when you registered.
        </p>
        <Link href="/auth/login" className={authPrimaryButtonClass + " inline-block text-center"}>
          Sign in
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
