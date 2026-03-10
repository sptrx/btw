import Link from "next/link";
import { IoChatbubbles } from "react-icons/io5";
import NavBar from "./navbar";
import { getCurrentUser } from "@/actions";

export default async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="flex justify-between md:items-baseline mt-4 border-b pb-4">
      <div className="flex items-center md:space-x-12">
        <div className="hidden md:flex md:items-center md:space-x-1">
          <Link href="/" className="text-xl font-semibold">
            BTW
          </Link>
          <IoChatbubbles size={24} className="text-indigo-600" />
        </div>

        <NavBar user={user} />
      </div>
    </header>
  );
}
