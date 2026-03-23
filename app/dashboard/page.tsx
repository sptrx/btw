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
    <div className="px-4">
      <h1 className="text-2xl font-bold tracking-tight mb-4">Dashboard</h1>
      <p className="text-muted-foreground mb-6">
        Welcome back, {user.email?.split("@")[0] ?? "there"}.
      </p>
      <div className="space-y-3">
        <Link
          href="/channel"
          className="block p-4 border border-border rounded-xl hover:bg-muted/50 transition-colors"
        >
          Browse Channels
        </Link>
        <Link
          href="/channel/new"
          className="block p-4 border border-border rounded-xl hover:bg-muted/50 transition-colors"
        >
          Create a channel
        </Link>
        <Link
          href="/profile"
          className="block p-4 border border-border rounded-xl hover:bg-muted/50 transition-colors"
        >
          View your profile
        </Link>
        <Link
          href="/dashboard/settings"
          className="block p-4 border border-border rounded-xl hover:bg-muted/50 transition-colors"
        >
          Settings
        </Link>
      </div>
    </div>
  );
}
  