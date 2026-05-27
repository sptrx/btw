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
  Search,
  Home,
  Hash,
  BookOpen,
  Sun,
  Moon,
} from "lucide-react";
import { useState, useEffect, useCallback, type ReactNode } from "react";
import { DropdownMenu } from "radix-ui";
import { useTheme } from "next-themes";
import { signOut } from "@/actions";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { GlobalSearch } from "@/components/global-search/global-search";
import { NotificationBell } from "@/components/notification-bell";
import { bibleAiPublicAskUrl, bibleAiSsoPath } from "@/lib/bible-ai-config";
import { cn } from "@/lib/utils";

import { UserAvatar } from "@/components/user-avatar";

type Props = {
  user: User | null;
  showMyChannels?: boolean;
  showModeration?: boolean;
  showBibleAiSsoNav?: boolean;
  showBibleAiPublicNav?: boolean;
  avatarUrl?: string | null;
  profileDisplayName?: string | null;
};

function buildNavLinks(showSso: boolean, showPublic: boolean) {
  return [
    { href: "/", label: "Home" as const },
    { href: "/channel/browse", label: "Channels" as const },
    ...(showSso
      ? [{ href: bibleAiSsoPath("/ask"), label: "Bible Q&A" as const, external: false as const }]
      : showPublic
        ? [{ href: bibleAiPublicAskUrl(), label: "Bible Q&A" as const, external: true as const }]
        : []),
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
function navActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/channel/browse") return pathname.startsWith("/channel");
  return pathname === href;
}

const MOBILE_NAV_ID = "mobile-primary-nav";

const dropdownItemClass =
  "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground no-underline outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground";

const mobileMenuItemClass =
  "h-11 w-full justify-start gap-3 rounded-lg px-3 font-medium";

function MobileMenuSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-1">
      <p className={cn("px-3 btw-overline font-semibold")}>
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
  showBibleAiSsoNav = true,
  showBibleAiPublicNav = false,
  avatarUrl,
  profileDisplayName,
}: Props) {
  const navLinks = buildNavLinks(showBibleAiSsoNav, showBibleAiPublicNav);
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [themeMounted, setThemeMounted] = useState(false);
  const userLabel = user
    ? profileDisplayName?.trim() || headerDisplayName(user)
    : null;

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const openMobileSearch = useCallback(() => {
    closeMobile();
    setSearchOpen(true);
  }, [closeMobile]);

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
      <div className="container mx-auto flex max-w-6xl items-center gap-3 px-3 py-2.5 sm:px-5 sm:py-3">
        {/* Logo — full width on mobile minus menu; no grid wrap */}
        <BtwLogo
          href="/"
          priority
          size="header"
          linkClassName="flex shrink-0 items-center rounded-lg px-1 -ml-1 transition-colors hover:bg-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        />

        {/* Desktop nav — centered between logo and actions */}
        <nav
          className="hidden flex-1 justify-center md:flex md:items-center md:gap-0.5 md:rounded-full md:border md:border-border/60 md:bg-muted/50 md:p-1 dark:md:border-transparent dark:md:bg-transparent"
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

        {/* Right: desktop tools + compact mobile menu trigger */}
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5 md:gap-2">
          <div className="hidden md:block">
            <GlobalSearch />
          </div>
          {user ? <NotificationBell className="shrink-0" /> : null}
          <ThemeToggle className="hidden md:inline-flex" />
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

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} showTrigger={false} />

      {/* Mobile nav — single clean panel; tools live here, not under the logo row */}
      <div
        id={MOBILE_NAV_ID}
        className={cn(
          "md:hidden",
          mobileOpen
            ? "border-t border-header-border bg-muted/20 px-3 pb-3 pt-2 dark:border-border/40 dark:bg-background/95"
            : "hidden"
        )}
      >
        <nav
          className="container mx-auto max-w-6xl space-y-4 rounded-2xl border border-border/70 bg-card p-3 shadow-sm pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          aria-label="Primary mobile"
        >
          {user && userLabel !== null ? (
            <div className="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2.5">
              <UserAvatar name={userLabel} avatarUrl={avatarUrl} size="md" />
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

          <MobileMenuSection title="Explore">
            {navLinks.map((link) => {
              const external = "external" in link && link.external;
              const active = !external && navActive(link.href, pathname);
              const Icon =
                link.label === "Home" ? Home : link.label === "Channels" ? Hash : BookOpen;
              return (
                <Button
                  key={link.href}
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
                      {link.label}
                      <span className="sr-only"> (opens in new tab)</span>
                    </a>
                  ) : (
                    <Link href={link.href}>
                      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                      {link.label}
                    </Link>
                  )}
                </Button>
              );
            })}
          </MobileMenuSection>

          <MobileMenuSection title="Tools">
            <Button
              variant="ghost"
              type="button"
              className={mobileMenuItemClass}
              onClick={openMobileSearch}
            >
              <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              Search
            </Button>
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
            <MobileMenuSection title="Your account">
              <Button variant="ghost" className={mobileMenuItemClass} asChild onClick={closeMobile}>
                <Link href="/dashboard">
                  <LayoutDashboard className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  Dashboard
                </Link>
              </Button>
              <Button variant="ghost" className={mobileMenuItemClass} asChild onClick={closeMobile}>
                <Link href="/dashboard/library">
                  <Bookmark className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  Your library
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
              <Button className="mt-1 h-11 w-full justify-center rounded-lg" asChild onClick={closeMobile}>
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
            <MobileMenuSection title="Join">
              <Button variant="ghost" className={mobileMenuItemClass} asChild onClick={closeMobile}>
                <Link href="/auth/login">Sign in</Link>
              </Button>
              <Button className="h-11 w-full justify-center rounded-lg" asChild onClick={closeMobile}>
                <Link href="/auth/signup">Sign up</Link>
              </Button>
            </MobileMenuSection>
          )}
        </nav>
      </div>
    </header>
  );
}
