import Link from "next/link";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
      <div className="col-span-2">{children}</div>
      <nav className="border rounded p-4">
        <ul className="space-y-2">
          <li>
            <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          </li>
          <li>
            <Link href="/dashboard/settings" className="hover:underline">Settings</Link>
          </li>
          <li>
            <Link href="/channel" className="hover:underline">Browse channels</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
