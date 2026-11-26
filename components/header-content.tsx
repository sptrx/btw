"use client";

import { BtwLogo } from "@/components/btw-logo";
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
  Plus,
  Home,
  Hash,
  BookOpen,
  Sun,
  Moon,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { DropdownMenu } from "radix-ui";
import { useTheme } from "next-themes";
import { signOut } from "@/actions";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { GlobalSearch } from "@/components/global-search/global-search";
import { NotificationBell } from "@/components/notification-bell";
import { type BibleAiNavLink } from "@/lib/bible-ai-config";
import { cn } from "@/lib/utils";

import { UserAvatar } from "@/components/user-avatar";

type Props = {
  user: User | null;
  showMyChannels?: boolean;
  showModeration?: boolean;
  bibleAiNavLink?: BibleAiNavLink | null;
  avatarUrl?: string | null;
  profileDisplayName?: string | null;
};

/** Home is the feed-first page for guests and signed-in members. */
function homeHref(_isLoggedIn: boolean) {
  return "/";
}

function buildNavLinks(
  bibleAiNavLink: BibleAiNavLink | null | undefined,
  isLoggedIn: boolean
) {
  return [
    { href: homeHref(isLoggedIn), label: "Home" as const },
    { href: "/explore", label: "Explore" as const },
    { href: "/channel/browse", label: "Channels" as const },
    { href: "/shorts", label: "Shorts" as const },
    { href: "/prayer", label: "Prayer" as const },
    { href: "/bible", label: "Bible" as const },
    ...(bibleAiNavLink ? [bibleAiNavLink] : []),
  ] as const;
}

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
function navActive(href: string, pathname: string, isLoggedIn: boolean): boolean {
  if (href === homeHref(isLoggedIn)) {
    return pathname === "/";
  }
  if (href === "/explore") return pathname === "/explore";
  if (href === "/bible") return pathname === "/bible" || pathname.startsWith("/bible/");
  if (href === "/channel/browse") return pathname.startsWith("/channel");
  if (href === "/prayer") return pathname === "/prayer" || pathname.startsWith("/prayer/");
  return pathname === href;
}

const MOBILE_NAV_ID = "mobile-primary-nav";

const dropdownItemClass =
  "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground no-underline outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground";

const mobileMenuItemClass =
  "h-9 w-full justify-start gap-2 rounded-lg px-2.5 text-sm font-medium";

function MobileMenuSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-0.5", className)}>
      <p className={cn("px-2.5 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground")}>
        {title}
      </p>
      <div className="space-y-0.5">{children}</div>
    </section>
  );
}

export function HeaderContent({
  user,
  showMyChannels,
  showModeration,
  bibleAiNavLink = null,
  avatarUrl,
  profileDisplayName,
}: Props) {
  const isLoggedIn = Boolean(user);
  const navLinks = buildNavLinks(bibleAiNavLink, isLoggedIn);
  const primaryHomeHref = homeHref(isLoggedIn);
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [themeMounted, setThemeMounted] = useState(false);
  const userLabel = user
    ? profileDisplayName?.trim() || headerDisplayName(user)
    : null;

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    setThemeMounted(true);
  }, []);

  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobile();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, closeMobile]);

  const menuRootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    const onPointer = (event: MouseEvent) => {
      const root = menuRootRef.current;
      if (root && !root.contains(event.target as Node)) closeMobile();
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [mobileOpen, closeMobile]);

  return (
    <header
      className="sticky top-0 z-50 w-full border-b-2 border-[#c9a24a] bg-[oklch(0.985_0.01_92)]/95 pt-[env(safe-area-inset-top)] backdrop-blur-sm transition-[background,box-shadow,border-color] duration-300 dark:border-b dark:border-border/50 dark:bg-neutral-900/90 dark:shadow-none dark:backdrop-blur-md"
      role="banner"
    >
      <div className="mx-auto w-full max-w-[1240px] px-3 sm:px-4 lg:px-5">
        <div className="flex min-h-[var(--header-bar-height)] items-center gap-2 py-2 sm:gap-3">
          <div className="min-w-0 shrink-0 overflow-hidden">
            <BtwLogo
              href={primaryHomeHref}
              priority
              size="header"
              linkClassName="flex min-w-0 max-w-full items-center rounded-lg px-1 -ml-1 transition-colors hover:bg-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            />
          </div>

        <div className="min-w-0 flex-1 px-1 sm:px-2">
          <GlobalSearch
            variant="bar"
            className="mx-auto max-w-xl"
            open={searchOpen}
            onOpenChange={setSearchOpen}
          />
        </div>

        <div className="ml-auto flex shrink-0 items-center justify-end gap-1 sm:gap-1.5">
          {user ? <NotificationBell className="shrink-0" /> : null}
          {!user ? (
            <Button size="sm" className="h-9 rounded-full px-3.5 text-sm md:hidden" asChild>
              <Link href="/auth/signup">Sign up</Link>
            </Button>
          ) : null}
          <ThemeToggle className="hidden lg:inline-flex" />
          <div className="hidden min-w-0 items-center gap-2 md:flex">
            {user ? (
              <>
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
                        <Link href="/channel/new" className={dropdownItemClass}>
                          <Plus className="size-4 text-muted-foreground" aria-hidden />
                          Create channel
                        </Link>
                      </DropdownMenu.Item>
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
                          Library
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

          <div className="relative" ref={menuRootRef}>
          <Button
            variant="ghost"
            size="icon"
            className="size-11 shrink-0 touch-manipulation lg:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            aria-controls={MOBILE_NAV_ID}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </Button>
          {mobileOpen ? (
          <nav
            id={MOBILE_NAV_ID}
            className="absolute right-0 top-[calc(100%+0.35rem)] z-50 max-h-[min(32rem,80vh)] w-60 overflow-y-auto rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg"
            aria-label="Primary"
          >
          {user && userLabel !== null ? (
            <div className="mb-1 flex items-center gap-2 rounded-lg bg-muted/40 px-2 py-2 md:hidden">
              <UserAvatar name={userLabel} avatarUrl={avatarUrl} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground" title={userLabel}>
                  {userLabel}
                </p>
                {user.email ? (
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                ) : null}
              </div>
            </div>
          ) : null}

          {!user ? (
            <MobileMenuSection title="Join" className="md:hidden">
              <Button variant="ghost" className={mobileMenuItemClass} asChild onClick={closeMobile}>
                <Link href="/auth/login">Sign in</Link>
              </Button>
            </MobileMenuSection>
          ) : null}

          <MobileMenuSection title="Discover">
            {navLinks.map((link) => {
              const external = "external" in link && link.external;
              const active = !external && navActive(link.href, pathname, isLoggedIn);
              const Icon =
                link.label === "Home" ? Home : link.label === "Channels" ? Hash : BookOpen;
              const labelBlock = <span className="truncate">{link.label}</span>;
              return (
                <Button
                  key={`${link.label}-${link.href}`}
                  variant="ghost"
                  className={cn(
                    mobileMenuItemClass,
                    active && "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
                  )}
                  asChild
                  onClick={closeMobile}
                  aria-current={active ? "page" : undefined}
                >
                  {external ? (
                    <a href={link.href} target="_blank" rel="noopener noreferrer">
                      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                      {labelBlock}
                      <span className="sr-only"> (opens in new tab)</span>
                    </a>
                  ) : (
                    <Link href={link.href}>
                      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                      {labelBlock}
                    </Link>
                  )}
                </Button>
              );
            })}
          </MobileMenuSection>

          <MobileMenuSection title="Tools" className="lg:hidden">
            <Button
              variant="ghost"
              type="button"
              className={mobileMenuItemClass}
              onClick={() => {
                if (!themeMounted) return;
                setTheme(resolvedTheme === "dark" ? "light" : "dark");
              }}
            >
              {themeMounted && resolvedTheme === "dark" ? (
                <Sun className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              ) : (
                <Moon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              )}
              {themeMounted && resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
            </Button>
          </MobileMenuSection>

          {user ? (
            <MobileMenuSection title="Your account" className="md:hidden">
              <Button variant="ghost" className={mobileMenuItemClass} asChild onClick={closeMobile}>
                <Link href="/dashboard">
                  <LayoutDashboard className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  Dashboard
                </Link>
              </Button>
              <Button variant="ghost" className={mobileMenuItemClass} asChild onClick={closeMobile}>
                <Link href="/dashboard/library">
                  <Bookmark className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  Library
                </Link>
              </Button>
              {showModeration ? (
                <Button variant="ghost" className={mobileMenuItemClass} asChild onClick={closeMobile}>
                  <Link href="/dashboard/moderation">
                    <ShieldCheck className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    Moderation
                  </Link>
                </Button>
              ) : null}
              {showMyChannels ? (
                <Button variant="ghost" className={mobileMenuItemClass} asChild onClick={closeMobile}>
                  <Link href="/channel">
                    <Folder className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    My channels
                  </Link>
                </Button>
              ) : null}
              <Button variant="ghost" className={mobileMenuItemClass} asChild onClick={closeMobile}>
                <Link href="/profile">
                  <UserRound className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  Profile
                </Link>
              </Button>
              <Button className="mt-1 h-9 w-full justify-center rounded-lg text-sm" asChild onClick={closeMobile}>
                <Link href="/channel/new">Create channel</Link>
              </Button>
              <form action={signOut} onSubmit={closeMobile} className="pt-1">
                <Button
                  variant="ghost"
                  type="submit"
                  className={cn(mobileMenuItemClass, "text-destructive hover:text-destructive")}
                >
                  <LogOut className="size-4 shrink-0" aria-hidden />
                  Sign out
                </Button>
              </form>
            </MobileMenuSection>
          ) : (
            null
          )}
          </nav>
          ) : null}
          </div>
        </div>
        </div>
      </div>
    </header>
  );
}
