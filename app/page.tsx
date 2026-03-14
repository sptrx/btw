import Link from "next/link";

export default function Home() {
  return (
    <main className="text-center py-16">
      <h1 className="text-4xl font-bold mb-4">BTW</h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
        A Christian faith-based social platform
      </p>
      <p className="text-gray-500 dark:text-gray-500 mb-8 max-w-lg mx-auto">
        Explore channels with videos, podcasts, articles, and discussions. Sign up
        to comment and share. AI-powered moderation keeps content safe.
      </p>
      <div className="flex gap-4 justify-center">
        <Link
          href="/auth/signup"
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Get started
        </Link>
        <Link
          href="/auth/login"
          className="px-6 py-3 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
