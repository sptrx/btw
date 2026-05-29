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
import type { BibleAiNavLink } from "@/lib/bible-ai-config";
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

/** Signed-in users land on the faith feed; guests see the marketing home at `/`. */
function homeHref(isLoggedIn: boolean) {
  return isLoggedIn ? "/feed" : "/";
}

function buildNavLinks(
  bibleAiNavLink: BibleAiNavLink | null | undefined,
  isLoggedIn: boolean
) {
  return [
    { href: homeHref(isLoggedIn), label: "Home" as const },
    { href: "/explore", label: "Explore" as const },
    { href: "/map", label: "World map" as const },
    { href: "/channel/browse", label: "Channels" as const },
    { href: "/prayer", label: "Prayer Wall" as const },
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
    return isLoggedIn ? pathname === "/feed" : pathname === "/";
  }
  if (href === "/explore") return pathname === "/explore" || pathname.startsWith("/ask");
  if (href === "/map") return pathname === "/map";
  if (href === "/channel/browse") return pathname.startsWith("/channel");
  if (href === "/prayer") return pathname === "/prayer" || pathname.startsWith("/prayer/");
  return pathname === href;
}

const MOBILE_NAV_ID = "mobile-primary-nav";

const dropdownItemClass =
  "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground no-underline outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground";

const mobileMenuItemClass =
  "h-11 w-full justify-start gap-3 whitespace-normal rounded-lg px-3 font-medium";

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

  const openMobileSearch = useCallback(() => {
    closeMobile();
    setSearchOpen(true);
  }, [closeMobile]);

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

  useEffect(() => {
    if (!mobileOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileOpen]);

  return (
    <header
      className="sticky top-0 z-50 w-full overflow-x-clip border-b border-header-border bg-[oklch(0.72_0.04_108)]/95 pt-[env(safe-area-inset-top)] shadow-[0_1px_0_0_var(--header-border)] backdrop-blur-sm transition-[background,box-shadow,border-color] duration-300 dark:border-border/50 dark:bg-neutral-900/90 dark:shadow-none dark:backdrop-blur-md"
      role="banner"
    >
      <div className="container mx-auto max-w-6xl px-3 sm:px-5">
        {/* Top bar: flex on mobile; 3-column grid on desktop so nav stays visually centered */}
        <div className="flex min-h-[var(--header-bar-height)] items-center gap-2 py-2.5 sm:gap-3 sm:py-3 md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center md:gap-4">
          <div className="min-w-0 justify-self-start md:col-start-1">
            <BtwLogo
              href={primaryHomeHref}
              priority
              size="header"
              linkClassName="flex max-w-full items-center rounded-lg px-1 -ml-1 transition-colors hover:bg-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            />
          </div>

        <nav
          className="hidden md:col-start-2 md:flex md:items-center md:justify-self-center md:gap-0.5 md:rounded-full md:border md:border-border/60 md:bg-muted/50 md:p-1 dark:md:border-transparent dark:md:bg-transparent"
          aria-label="Primary"
        >
          {navLinks.map((link) => {
            const external = "external" in link && link.external;
            const active = !external && navActive(link.href, pathname, isLoggedIn);
            const subtitle =
              "description" in link && typeof link.description === "string"
                ? link.description
                : undefined;
            return (
              <Button
                key={`${link.label}-${link.href}`}
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
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={subtitle}
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link href={link.href} title={subtitle}>
                    {link.label}
                  </Link>
                )}
              </Button>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center justify-end gap-1 sm:gap-1.5 md:col-start-3 md:ml-0 md:gap-2 md:justify-self-end">
          <div className="hidden md:block">
            <GlobalSearch />
          </div>
          {user ? <NotificationBell className="shrink-0" /> : null}
          <ThemeToggle className="hidden md:inline-flex" />
          <div className="hidden min-w-0 md:flex md:items-center md:gap-2">
            {user ? (
              <>
                <Button size="sm" asChild>
                  <Link href="/channel/new">Create Channel</Link>
                </Button>
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

        <div
          id={MOBILE_NAV_ID}
          className={cn(
            "md:hidden",
            mobileOpen
              ? "border-t border-header-border pb-3 pt-2 dark:border-border/40"
              : "hidden"
          )}
        >
          <nav
            className="space-y-4 rounded-2xl border border-border/70 bg-card p-3 shadow-sm pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:bg-card/95"
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
              const active = !external && navActive(link.href, pathname, isLoggedIn);
              const subtitle =
                "description" in link && typeof link.description === "string"
                  ? link.description
                  : undefined;
              const Icon =
                link.label === "Home" ? Home : link.label === "Channels" ? Hash : BookOpen;
              const labelBlock = (
                <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left">
                  <span>{link.label}</span>
                  {subtitle ? (
                    <span className="text-xs font-normal text-muted-foreground">{subtitle}</span>
                  ) : null}
                </span>
              );
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
      </div>
    </header>
  );
}
