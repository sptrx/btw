"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  Folder,
  UserRound,
  LogOut,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { DropdownMenu } from "radix-ui";
import { signOut } from "@/actions";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { GlobalSearch } from "@/components/global-search/global-search";
import { NotificationBell } from "@/components/notification-bell";
import { bibleAiPublicAskUrl } from "@/lib/bible-ai-config";
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

/** Two-letter initials for the account avatar. */
function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Whether a primary nav link points at the current section. */
function navActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/channel/browse") return pathname.startsWith("/channel");
  return pathname === href;
}

const bibleAiUrl = bibleAiPublicAskUrl();

const navLinks = [
  { href: "/", label: "Home" as const },
  { href: "/channel/browse", label: "Channels" as const },
  { href: bibleAiUrl, label: "Bible Q&A" as const, external: true as const },
];

const MOBILE_NAV_ID = "mobile-primary-nav";

const displayFont = "font-[family-name:var(--font-landing-display)]";

const dropdownItemClass =
  "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground no-underline outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground";

export function HeaderContent({ user, isChannelAuthor }: Props) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const userLabel = user ? headerDisplayName(user) : null;

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const onHero = isHome;
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
          : "border-b border-header bg-[oklch(0.72_0.04_108)]/95 shadow-[0_1px_0_0_var(--header-border)] backdrop-blur-sm dark:border-border/50 dark:bg-neutral-900/90 dark:shadow-none dark:backdrop-blur-md"
      )}
      role="banner"
    >
      <div className="container mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-2 px-4 pt-3 pb-1 sm:px-5 sm:pt-4 sm:pb-2">
        {/* Logo — left-anchored brand mark */}
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
          <Image
            //src="/assets/btw-logo-converted-04.svg"
            src="/assets/btw-logo-withought-gold-shipe-in-b-export-olive.svg"
            alt="Believe The Works"
            width={1536}
            height={1024}
            priority
            className="h-16 w-auto shrink-0 object-contain sm:h-35"
          />
        </Link>

        {/* Desktop nav — segmented pill group with active-section indicator */}
        <nav
          className={cn(
            "hidden md:flex md:items-center md:gap-0.5 md:rounded-full md:border md:p-1",
            onHero
              ? "border-white/20 bg-white/10"
              : "border-border/60 bg-muted/50 dark:md:border-transparent dark:md:bg-transparent"
          )}
          aria-label="Primary"
        >
          {navLinks.map((link) => {
            const external = "external" in link && link.external;
            const active = !external && navActive(link.href, pathname);
            return (
              <Button
                key={link.href}
                variant="ghost"
                size="sm"
                asChild
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full font-medium transition-colors",
                  onHero
                    ? active
                      ? "bg-white/20 text-white hover:bg-white/20 hover:text-white"
                      : "text-white/80 hover:bg-white/15 hover:text-white"
                    : active
                      ? "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
                      : "text-muted-foreground"
                )}
              >
                {external ? (
                  <a href={link.href} target="_blank" rel="noopener noreferrer">
                    {link.label}
                  </a>
                ) : (
                  <Link href={link.href}>{link.label}</Link>
                )}
              </Button>
            );
          })}
        </nav>

        {/* Right: search, theme, account */}
        <div className="flex min-w-0 items-center gap-2">
          <GlobalSearch
            className={
              onHero ? "text-white hover:bg-white/15 hover:text-white [&_svg]:text-white" : undefined
            }
          />
          {user && (
            <NotificationBell
              className={
                onHero
                  ? "text-white hover:bg-white/15 hover:text-white [&_svg]:text-white"
                  : undefined
              }
            />
          )}
          <ThemeToggle
            className={
              onHero ? "text-white hover:bg-white/15 hover:text-white [&_svg]:text-white" : undefined
            }
          />
          <div className="hidden min-w-0 md:flex md:items-center md:gap-2">
            {user ? (
              <>
                {isChannelAuthor && (
                  <Button
                    size="sm"
                    asChild
                    className={onHero ? "bg-white text-neutral-900 hover:bg-white/90" : undefined}
                  >
                    <Link href="/channel/new">Create Channel</Link>
                  </Button>
                )}
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button
                      type="button"
                      aria-label="Account menu"
                      className={cn(
                        "flex shrink-0 items-center gap-1 rounded-full p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        onHero
                          ? "hover:bg-white/15 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
                          : "hover:bg-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-8 items-center justify-center rounded-full text-xs font-semibold",
                          onHero ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                        )}
                      >
                        {initialsFrom(userLabel ?? "")}
                      </span>
                      <ChevronDown
                        className={cn("size-4", onHero ? "text-white/70" : "text-muted-foreground")}
                        aria-hidden
                      />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      align="end"
                      sideOffset={8}
                      className="z-50 min-w-56 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg"
                    >
                      <div className="px-2.5 py-2">
                        <p
                          className="truncate text-sm font-medium text-foreground"
                          title={userLabel ?? undefined}
                        >
                          {userLabel}
                        </p>
                        {user.email && (
                          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                        )}
                      </div>
                      <DropdownMenu.Separator className="my-1 h-px bg-border" />
                      <DropdownMenu.Item asChild>
                        <Link href="/dashboard" className={dropdownItemClass}>
                          <LayoutDashboard className="size-4 text-muted-foreground" aria-hidden />
                          Dashboard
                        </Link>
                      </DropdownMenu.Item>
                      {isChannelAuthor && (
                        <DropdownMenu.Item asChild>
                          <Link href="/channel" className={dropdownItemClass}>
                            <Folder className="size-4 text-muted-foreground" aria-hidden />
                            My channels
                          </Link>
                        </DropdownMenu.Item>
                      )}
                      <DropdownMenu.Item asChild>
                        <Link href="/profile" className={dropdownItemClass}>
                          <UserRound className="size-4 text-muted-foreground" aria-hidden />
                          Profile
                        </Link>
                      </DropdownMenu.Item>
                      <DropdownMenu.Separator className="my-1 h-px bg-border" />
                      <DropdownMenu.Item
                        onSelect={() => {
                          void signOut();
                        }}
                        className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-destructive outline-none transition-colors focus:bg-destructive/10 data-[highlighted]:bg-destructive/10"
                      >
                        <LogOut className="size-4" aria-hidden />
                        Sign out
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
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

      {/* Mobile nav — floating card so it doesn't blend into the page */}
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
            <div className="mb-1 flex items-center gap-3 border-b border-border px-2 py-2">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {initialsFrom(userLabel)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground" title={userLabel}>
                  {userLabel}
                </p>
                {user.email && (
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                )}
              </div>
            </div>
          )}
          {navLinks.map((link) => {
            const external = "external" in link && link.external;
            const active = !external && navActive(link.href, pathname);
            return (
              <Button
                key={link.href}
                variant="ghost"
                className={cn(
                  "h-11 justify-start rounded-lg font-medium",
                  active && "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
                )}
                asChild
                onClick={() => setMobileOpen(false)}
                aria-current={active ? "page" : undefined}
              >
                {external ? (
                  <a href={link.href} target="_blank" rel="noopener noreferrer">
                    {link.label}
                    <span className="sr-only"> (opens in new tab)</span>
                  </a>
                ) : (
                  <Link href={link.href}>{link.label}</Link>
                )}
              </Button>
            );
          })}
          {user ? (
            <>
              <div className="my-1 border-t border-border" />
              <Button
                variant="ghost"
                className="h-11 justify-start rounded-lg"
                asChild
                onClick={() => setMobileOpen(false)}
              >
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              {isChannelAuthor && (
                <Button
                  variant="ghost"
                  className="h-11 justify-start rounded-lg"
                  asChild
                  onClick={() => setMobileOpen(false)}
                >
                  <Link href="/channel">My channels</Link>
                </Button>
              )}
              <Button
                variant="ghost"
                className="h-11 justify-start rounded-lg"
                asChild
                onClick={() => setMobileOpen(false)}
              >
                <Link href="/profile">Profile</Link>
              </Button>
              {isChannelAuthor && (
                <Button
                  className="mt-1 h-11 justify-start rounded-lg"
                  asChild
                  onClick={() => setMobileOpen(false)}
                >
                  <Link href="/channel/new">Create Channel</Link>
                </Button>
              )}
              <form
                action={signOut}
                onSubmit={() => setMobileOpen(false)}
                className="mt-1 border-t border-border pt-1"
              >
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
              <Button
                variant="ghost"
                className="h-11 justify-start rounded-lg"
                asChild
                onClick={() => setMobileOpen(false)}
              >
                <Link href="/auth/login">Sign in</Link>
              </Button>
              <Button
                className="h-11 justify-start rounded-lg"
                asChild
                onClick={() => setMobileOpen(false)}
              >
                <Link href="/auth/signup">Sign up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
