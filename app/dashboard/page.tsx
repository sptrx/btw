import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your BTW dashboard",
};

export default async function Dashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  return (
    <div>
      <p className="btw-section-eyebrow">Account</p>
      <h1 className="btw-page-title">Dashboard</h1>
      <p className="mb-8 mt-2 text-muted-foreground">
        Welcome back, {user.email?.split("@")[0] ?? "there"}.
      </p>
      <div className="space-y-3">
        <Link href="/channel" className="btw-app-row font-medium">
          Browse channels
        </Link>
        <Link href="/channel/new" className="btw-app-row font-medium">
          Create a channel
        </Link>
        <Link href="/profile" className="btw-app-row font-medium">
          View your profile
        </Link>
        <Link href="/dashboard/settings" className="btw-app-row font-medium">
          Settings
        </Link>
      </div>
    </div>
  );
}
  