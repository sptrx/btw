"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  Menu,
  X,
  ChevronDown,
  ShieldCheck,
  LayoutDashboard,
  Bookmark,
  Folder,
  UserRound,
  LogOut,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { DropdownMenu } from "radix-ui";
import { useTheme } from "next-themes";
import { signOut } from "@/actions";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { GlobalSearch } from "@/components/global-search/global-search";
import { NotificationBell } from "@/components/notification-bell";
import { bibleAiPublicAskUrl } from "@/lib/bible-ai-config";
import { cn } from "@/lib/utils";

import { UserAvatar } from "@/components/user-avatar";

type Props = {
  user: User | null;
  showMyChannels?: boolean;
  showModeration?: boolean;
  avatarUrl?: string | null;
  profileDisplayName?: string | null;
};

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

export function HeaderContent({ user, showMyChannels, showModeration, avatarUrl, profileDisplayName }: Props) {
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [themeMounted, setThemeMounted] = useState(false);
  const userLabel = user
    ? profileDisplayName?.trim() || headerDisplayName(user)
    : null;

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    setThemeMounted(true);
  }, []);

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
      className="sticky top-0 z-50 w-full overflow-x-clip border-b border-header bg-[oklch(0.72_0.04_108)]/95 pt-[env(safe-area-inset-top)] shadow-[0_1px_0_0_var(--header-border)] backdrop-blur-sm transition-[background,box-shadow,border-color] duration-300 dark:border-border/50 dark:bg-neutral-900/90 dark:shadow-none dark:backdrop-blur-md"
      role="banner"
    >
      <div className="container mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 py-2 sm:px-5 sm:py-3">
        {/* Logo — wide wordmark; width-capped on small screens so actions stay visible */}
        <Link
          href="/"
          className={cn(
            "flex min-h-10 min-w-0 items-center rounded-lg px-1 -ml-1 text-foreground transition-colors hover:bg-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            displayFont
          )}
        >
          <Image
            src="/assets/btw-logo-v6-deploy.svg"
            alt="Believe The Works"
            width={551}
            height={72}
            priority
            className="h-auto max-h-8 w-[min(42vw,9.75rem)] object-contain object-left sm:max-h-9 sm:w-[min(36vw,12rem)] md:max-h-10 md:w-auto md:max-w-[14rem] lg:max-w-[17rem]"
          />
        </Link>

        {/* Desktop nav — segmented pill group with active-section indicator */}
        <nav
          className="hidden md:flex md:items-center md:gap-0.5 md:rounded-full md:border md:border-border/60 md:bg-muted/50 md:p-1 dark:md:border-transparent dark:md:bg-transparent"
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
                  active
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
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1.5 md:gap-2">
          <GlobalSearch className="size-10 sm:size-11" />
          {user && <NotificationBell className="size-10 sm:size-11" />}
          <ThemeToggle className="hidden sm:inline-flex size-10 sm:size-11" />
          <div className="hidden min-w-0 md:flex md:items-center md:gap-2">
            {user ? (
              <>
                {user && (
                  <Button size="sm" asChild>
                    <Link href="/channel/new">Create Channel</Link>
                  </Button>
                )}
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button
                      type="button"
                      aria-label="Account menu"
                      className="flex shrink-0 items-center gap-1 rounded-full p-0.5 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <UserAvatar name={userLabel ?? "Account"} avatarUrl={avatarUrl} size="sm" />
                      <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
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
                      {showModeration ? (
                        <DropdownMenu.Item asChild>
                          <Link href="/dashboard/moderation" className={dropdownItemClass}>
                            <ShieldCheck className="size-4 text-muted-foreground" aria-hidden />
                            Moderation
                          </Link>
                        </DropdownMenu.Item>
                      ) : null}
                      <DropdownMenu.Item asChild>
                        <Link href="/dashboard/library" className={dropdownItemClass}>
                          <Bookmark className="size-4 text-muted-foreground" aria-hidden />
                          Your library
                        </Link>
                      </DropdownMenu.Item>
                      {showMyChannels && (
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
            className="size-10 shrink-0 touch-manipulation sm:size-11 md:hidden"
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
            ? "block border-t border-header-border bg-muted/30 px-3 pb-3 pt-1 dark:border-border/40 dark:bg-background/95"
            : "hidden"
        )}
      >
        <nav
          className="container mx-auto flex max-w-6xl flex-col gap-0.5 btw-surface p-2 shadow-md shadow-foreground/5 dark:shadow-black/25 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
          aria-label="Primary mobile"
        >
          {user && userLabel !== null && (
            <div className="mb-1 flex items-center gap-3 border-b border-border px-2 py-2">
              <UserAvatar name={userLabel} avatarUrl={avatarUrl} size="md" />
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
          <Button
            variant="ghost"
            className="h-11 justify-start rounded-lg sm:hidden"
            type="button"
            onClick={() => {
              if (!themeMounted) return;
              setTheme(resolvedTheme === "dark" ? "light" : "dark");
            }}
          >
            {themeMounted && resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
          </Button>
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
              <Button
                variant="ghost"
                className="h-11 justify-start rounded-lg"
                asChild
                onClick={() => setMobileOpen(false)}
              >
                <Link href="/dashboard/library">Your library</Link>
              </Button>
              {showModeration ? (
                <Button
                  variant="ghost"
                  className="h-11 justify-start rounded-lg"
                  asChild
                  onClick={() => setMobileOpen(false)}
                >
                  <Link href="/dashboard/moderation">Moderation</Link>
                </Button>
              ) : null}
              {showMyChannels && (
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
              <Button
                className="mt-1 h-11 justify-start rounded-lg"
                asChild
                onClick={() => setMobileOpen(false)}
              >
                <Link href="/channel/new">Create Channel</Link>
              </Button>
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
