import Link from "next/link";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
      <div className="md:col-span-2">{children}</div>
      <nav className="btw-content-panel h-fit" aria-label="Dashboard sections">
        <ul className="space-y-1 text-sm">
          <li>
            <Link
              href="/dashboard"
              className="block rounded-lg px-3 py-2 font-medium text-foreground no-underline motion-safe:transition-colors motion-safe:hover:bg-muted"
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/settings"
              className="block rounded-lg px-3 py-2 text-muted-foreground no-underline motion-safe:transition-colors motion-safe:hover:bg-muted motion-safe:hover:text-foreground"
            >
              Settings
            </Link>
          </li>
          <li>
            <Link
              href="/channel"
              className="block rounded-lg px-3 py-2 text-muted-foreground no-underline motion-safe:transition-colors motion-safe:hover:bg-muted motion-safe:hover:text-foreground"
            >
              Browse channels
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
