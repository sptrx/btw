import type { Metadata, Viewport } from "next";
import { DM_Sans, Source_Serif_4 } from "next/font/google";
import Header from "@/components/header";
import { SiteShell } from "@/components/site-shell";
import { SiteFooter } from "@/components/site-footer";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthListener } from "@/components/auth-listener";
import { SkipLink } from "@/components/skip-link";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";
import { cn } from "@/lib/utils";
import { siteUrl } from "@/lib/site-url";
import { getSupabaseInlineConfig } from "@/utils/supabase/public-env";

/** Read Worker/runtime Supabase env on each request so we can inject it for the browser when NEXT_PUBLIC_* was missing at build. */
export const dynamic = "force-dynamic";

/** UI + titles — matches mobile “calm fintech” sans hierarchy (not Inter). */
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

/** Scripture / long-form reading only (Bible, verse blocks). */
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-reader",
  adjustFontFallback: true,
});

const ROOT_DESCRIPTION =
  "A Christian faith-based social platform with AI filtering for safe, encouraging community.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    template: "%s | BTW",
    default: "Believe The Works, share your witness, strengthen another",
  },
  description: ROOT_DESCRIPTION,
  applicationName: "Believe The Works",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Believe The Works",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    siteName: "Believe The Works",
    title: "Believe The Works, share your witness, strengthen another",
    description: ROOT_DESCRIPTION,
    url: "/",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630, alt: "Believe The Works" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Believe The Works, share your witness, strengthen another",
    description: ROOT_DESCRIPTION,
    images: ["/og-default.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8F4EA" },
    { media: "(prefers-color-scheme: dark)", color: "#0F0E0C" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabaseInline = getSupabaseInlineConfig();

  return (
    <html
      lang="en"
      className={cn("font-sans", dmSans.variable, sourceSerif.variable)}
      suppressHydrationWarning
    >
      <head>
        {/* The Cloudflare build adds `__name(...)` calls to functions that next-themes
            serialises into an inline script, where that helper doesn't exist. Define
            it first so the theme script runs instead of throwing on every page. */}
        <script
          dangerouslySetInnerHTML={{
            __html: "window.__name=window.__name||function(f){return f};",
          }}
        />
      </head>
      <body
        className={cn(dmSans.className, "min-h-dvh pb-[env(safe-area-inset-bottom)]")}
        suppressHydrationWarning
      >
        {supabaseInline ? (
          <script
            id="btw-supabase-env"
            dangerouslySetInnerHTML={{
              __html: `window.__BTW_SUPABASE__=${JSON.stringify({
                url: supabaseInline.url,
                k: supabaseInline.k,
              }).replace(/</g, "\\u003c")}`,
            }}
          />
        ) : null}
        <ThemeProvider>
          <PwaRegister />
          <SkipLink />
          <AuthListener />
          <Header />
          <SiteShell>{children}</SiteShell>
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
