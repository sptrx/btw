"use client";

import Link from "next/link";
import { User } from "@supabase/supabase-js";
import { Menu, X, MessageCircle } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { signOut } from "@/actions";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

type Props = { user: User | null; isChannelAuthor?: boolean };

function headerDisplayName(user: User): string {
  const meta = user.user_metadata;
  const full =
    typeof meta?.full_name === "string" ? meta.full_name.trim() : "";
  if (full) return full;
  const name = typeof meta?.name === "string" ? meta.name.trim() : "";
  if (name) return name;
  const email = user.email?.trim();
  if (email) {
    const local = email.split("@")[0];
    return local || email;
  }
  return "Account";
}

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/channel", label: "Channels" },
];

const MOBILE_NAV_ID = "mobile-primary-nav";

export function HeaderContent({ user, isChannelAuthor }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const userLabel = user ? headerDisplayName(user) : null;

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobile();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, closeMobile]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full pt-[env(safe-area-inset-top)]",
        /* Light: solid header surface + shadow; Dark: glass */
        "border-b border-header bg-header shadow-[0_1px_0_0_var(--header-border)]",
        "dark:border-border/50 dark:bg-background/85 dark:shadow-none dark:backdrop-blur-md"
      )}
      role="banner"
    >
      <div className="container mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:px-5">
        {/* Logo */}
        <Link
          href="/"
          className="flex min-h-11 shrink-0 items-center gap-1 sm:gap-1.5 rounded-lg font-semibold tracking-tight text-foreground transition-colors hover:bg-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background px-1 -ml-1"
        >
          <MessageCircle className="h-5 w-5 shrink-0 text-primary sm:h-6 sm:w-6" aria-hidden />
          <span className="whitespace-nowrap text-sm font-semibold leading-none tracking-tight sm:text-base md:text-lg">
            Believe The Works
          </span>
        </Link>

        {/* Desktop nav — pill group for clearer grouping on light bg */}
        <nav
          className="hidden md:flex md:items-center md:gap-0.5 md:rounded-full md:border md:border-border/60 md:bg-muted/50 md:px-1 md:py-0.5 dark:md:border-transparent dark:md:bg-transparent"
          aria-label="Primary"
        >
          {navLinks.map((link) => (
            <Button key={link.href} variant="ghost" size="sm" asChild className="rounded-full">
              <Link href={link.href} className="font-medium">
                {link.label}
              </Link>
            </Button>
          ))}
        </nav>

        {/* Right: auth + theme */}
        <div className="flex min-w-0 items-center gap-2">
          <ThemeToggle />
          <div className="hidden min-w-0 md:flex md:items-center md:gap-1">
            {user ? (
              <>
                {userLabel !== null && (
                  <span
                    className="max-w-[11rem] truncate text-sm font-medium text-foreground"
                    title={userLabel}
                  >
                    {userLabel}
                  </span>
                )}
                {isChannelAuthor && (
                  <>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/channel/my">My Channels</Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link href="/channel/new">Create Channel</Link>
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/profile">Profile</Link>
                </Button>
                <form action={signOut}>
                  <Button variant="ghost" size="sm" type="submit" className="text-destructive hover:text-destructive">
                    Sign out
                  </Button>
                </form>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/auth/login">Sign in</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/auth/signup">Sign up</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button — min 44×44 touch target */}
          <Button
            variant="ghost"
            size="icon"
            className="size-11 shrink-0 touch-manipulation md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            aria-controls={MOBILE_NAV_ID}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </Button>
        </div>
      </div>

      {/* Mobile nav — floating card so it doesn’t blend into white page */}
      <div
        id={MOBILE_NAV_ID}
        className={cn(
          "md:hidden",
          mobileOpen ? "block border-t border-header-border bg-muted/30 px-3 pb-3 pt-1 dark:border-border/40 dark:bg-background/95" : "hidden"
          )}
        >
          <nav
            className="container mx-auto flex max-w-6xl flex-col gap-0.5 rounded-xl border border-border bg-card p-2 shadow-md shadow-foreground/5 dark:shadow-black/20 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
            aria-label="Primary mobile"
          >
          {user && userLabel !== null && (
            <p className="px-2 py-1.5 text-sm text-muted-foreground border-b border-border mb-0.5">
              Signed in as{" "}
              <span className="font-medium text-foreground" title={userLabel}>
                {userLabel}
              </span>
            </p>
          )}
          {navLinks.map((link) => (
            <Button
              key={link.href}
              variant="ghost"
              className="h-11 justify-start rounded-lg font-medium"
              asChild
              onClick={() => setMobileOpen(false)}
            >
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
          {user ? (
            <>
              {isChannelAuthor && (
                <>
                  <Button variant="ghost" className="h-11 justify-start rounded-lg" asChild onClick={() => setMobileOpen(false)}>
                    <Link href="/channel/my">My Channels</Link>
                  </Button>
                  <Button className="h-11 justify-start rounded-lg" asChild onClick={() => setMobileOpen(false)}>
                    <Link href="/channel/new">Create Channel</Link>
                  </Button>
                </>
              )}
              <Button variant="ghost" className="h-11 justify-start rounded-lg" asChild onClick={() => setMobileOpen(false)}>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="ghost" className="h-11 justify-start rounded-lg" asChild onClick={() => setMobileOpen(false)}>
                <Link href="/profile">Profile</Link>
              </Button>
              <form action={signOut} onSubmit={() => setMobileOpen(false)} className="border-t border-border pt-1 mt-1">
                <Button
                  variant="ghost"
                  type="submit"
                  className="h-11 w-full justify-start rounded-lg text-destructive hover:text-destructive"
                >
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button variant="ghost" className="h-11 justify-start rounded-lg" asChild onClick={() => setMobileOpen(false)}>
                <Link href="/auth/login">Sign in</Link>
              </Button>
              <Button className="h-11 justify-start rounded-lg" asChild onClick={() => setMobileOpen(false)}>
                <Link href="/auth/signup">Sign up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
