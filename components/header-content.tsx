"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
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

/** Scripture Chat (bible-ai); defaults to local dev server. Set NEXT_PUBLIC_BIBLE_AI_URL in .env.local for production. */
const bibleAiUrl =
  typeof process.env.NEXT_PUBLIC_BIBLE_AI_URL === "string" &&
  process.env.NEXT_PUBLIC_BIBLE_AI_URL.trim().length > 0
    ? process.env.NEXT_PUBLIC_BIBLE_AI_URL.trim()
    : "http://localhost:3040/ask";

const navLinks = [
  { href: "/", label: "Home" as const },
  { href: "/channel/browse", label: "Channels" as const },
  { href: bibleAiUrl, label: "Bible Q&A" as const, external: true as const },
];

const MOBILE_NAV_ID = "mobile-primary-nav";

const displayFont = "font-[family-name:var(--font-landing-display)]";

export function HeaderContent({ user, isChannelAuthor }: Props) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const userLabel = user ? headerDisplayName(user) : null;

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const onHero = isHome;
  const navBtn = onHero ? "text-white hover:bg-white/15 hover:text-white" : "";
  const ghostOnHero = onHero ? "text-white hover:bg-white/15 hover:text-white" : "";

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
        "sticky top-0 z-50 w-full pt-[env(safe-area-inset-top)] transition-[background,box-shadow,border-color] duration-300",
        onHero
          ? "border-b border-white/15 bg-black/35 text-white shadow-none backdrop-blur-md dark:border-white/10 dark:bg-black/40"
          : "border-b border-header bg-header/90 shadow-[0_1px_0_0_var(--header-border)] backdrop-blur-sm dark:border-border/50 dark:bg-background/85 dark:shadow-none dark:backdrop-blur-md"
      )}
      role="banner"
    >
      <div className="container mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:px-5">
        {/* Logo — Playfair wordmark to match landing */}
        <Link
          href="/"
          className={cn(
            "flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-1 -ml-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            displayFont,
            onHero
              ? "text-white hover:bg-white/10 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
              : "text-foreground hover:bg-accent/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          )}
        >
          <MessageCircle
            className={cn("h-5 w-5 shrink-0 sm:h-6 sm:w-6", onHero ? "text-white/90" : "text-primary")}
            aria-hidden
          />
          <span className="whitespace-nowrap text-base font-normal leading-none tracking-tight md:text-lg">
            Believe The Works
          </span>
        </Link>

        {/* Desktop nav — pill group (light frosted on hero) */}
        <nav
          className={cn(
            "hidden md:flex md:items-center md:gap-0.5 md:rounded-full md:border md:px-1 md:py-0.5",
            onHero
              ? "border-white/20 bg-white/10"
              : "border-border/60 bg-muted/50 dark:md:border-transparent dark:md:bg-transparent"
          )}
          aria-label="Primary"
        >
          {navLinks.map((link) => (
            <Button
              key={link.href}
              variant="ghost"
              size="sm"
              asChild
              className={cn("rounded-full", navBtn)}
            >
              {"external" in link && link.external ? (
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium"
                >
                  {link.label}
                </a>
              ) : (
                <Link href={link.href} className="font-medium">
                  {link.label}
                </Link>
              )}
            </Button>
          ))}
        </nav>

        {/* Right: auth + theme */}
        <div className="flex min-w-0 items-center gap-2">
          <ThemeToggle
            className={
              onHero ? "text-white hover:bg-white/15 hover:text-white [&_svg]:text-white" : undefined
            }
          />
          <div className="hidden min-w-0 md:flex md:items-center md:gap-1">
            {user ? (
              <>
                {userLabel !== null && (
                  <span
                    className={cn(
                      "max-w-[11rem] truncate text-sm font-medium",
                      onHero ? "text-white/90" : "text-foreground"
                    )}
                    title={userLabel}
                  >
                    {userLabel}
                  </span>
                )}
                {isChannelAuthor && (
                  <>
                    <Button variant="ghost" size="sm" asChild className={ghostOnHero}>
                      <Link href="/channel">My channels</Link>
                    </Button>
                    <Button
                      size="sm"
                      asChild
                      className={onHero ? "bg-white text-primary hover:bg-white/90" : undefined}
                    >
                      <Link href="/channel/new">Create Channel</Link>
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="sm" asChild className={ghostOnHero}>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className={ghostOnHero}>
                  <Link href="/profile">Profile</Link>
                </Button>
                <form action={signOut}>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="submit"
                    className={
                      onHero
                        ? "text-rose-200 hover:text-rose-100 hover:bg-white/10"
                        : "text-destructive hover:text-destructive"
                    }
                  >
                    Sign out
                  </Button>
                </form>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className={ghostOnHero}>
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
            className={cn("size-11 shrink-0 touch-manipulation md:hidden", onHero && ghostOnHero)}
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
          mobileOpen
            ? cn(
                "block border-t px-3 pb-3 pt-1",
                onHero
                  ? "border-white/15 bg-black/50 backdrop-blur-md"
                  : "border-header-border bg-muted/30 dark:border-border/40 dark:bg-background/95"
              )
            : "hidden"
        )}
      >
          <nav
            className="container mx-auto flex max-w-6xl flex-col gap-0.5 btw-surface p-2 shadow-md shadow-foreground/5 dark:shadow-black/25 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
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
              {"external" in link && link.external ? (
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.label}
                  <span className="sr-only"> (opens in new tab)</span>
                </a>
              ) : (
                <Link href={link.href}>{link.label}</Link>
              )}
            </Button>
          ))}
          {user ? (
            <>
              {isChannelAuthor && (
                <>
                  <Button variant="ghost" className="h-11 justify-start rounded-lg" asChild onClick={() => setMobileOpen(false)}>
                    <Link href="/channel">My channels</Link>
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
