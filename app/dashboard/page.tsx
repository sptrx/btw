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
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Welcome back, {user.email?.split("@")[0] ?? "there"}.
      </p>
      <div className="space-y-3">
        <Link
          href="/feed"
          className="block p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Go to Feed
        </Link>
        <Link
          href="/topics"
          className="block p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Browse Topics
        </Link>
        <Link
          href="/topics/new"
          className="block p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Create a topic channel
        </Link>
        <Link
          href="/profile"
          className="block p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          View your profile
        </Link>
        <Link
          href="/dashboard/settings"
          className="block p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Settings
        </Link>
      </div>
    </div>
  );
}
  