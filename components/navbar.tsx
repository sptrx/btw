import Link from "next/link";
import { User } from "@supabase/supabase-js";
import { signOut } from "@/actions";

type Props = { user: User | null };

export default function NavBar({ user }: Props) {
  return (
    <nav>
      <ul className="flex flex-col md:flex-row md:space-x-4 md:items-center">
        <li>
          <Link href="/" className="link">
            Home
          </Link>
        </li>
        <li>
          <Link href="/feed" className="link">
            Feed
          </Link>
        </li>
        <li>
          <Link href="/channel" className="link">
            Channels
          </Link>
        </li>
        <li>
          <Link href="/topics" className="link">
            Topics
          </Link>
        </li>
        {user ? (
          <>
            <li>
              <Link href="/dashboard" className="link">
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/profile" className="link">
                Profile
              </Link>
            </li>
            <li>
              <form action={signOut}>
                <button type="submit" className="link text-red-600 dark:text-red-400">
                  Sign out
                </button>
              </form>
            </li>
          </>
        ) : (
          <>
            <li>
              <Link href="/auth/login" className="link">
                Sign in
              </Link>
            </li>
            <li>
              <Link
                href="/auth/signup"
                className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Sign up
              </Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}
