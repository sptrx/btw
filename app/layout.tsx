import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Script from "next/script";
import Header from "@/components/header";
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

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-landing-display",
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
    { media: "(prefers-color-scheme: light)", color: "#faf6ee" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1812" },
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
      className={cn("font-sans", inter.variable, playfair.variable)}
      suppressHydrationWarning
    >
      <body
        className={cn(inter.className, "min-h-dvh pb-[env(safe-area-inset-bottom)]")}
        suppressHydrationWarning
      >
        {supabaseInline ? (
          <Script
            id="btw-supabase-env"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: `window.__BTW_SUPABASE__=${JSON.stringify({
                url: supabaseInline.url,
                k: supabaseInline.k,
              })}`,
            }}
          />
        ) : null}
        <ThemeProvider>
          <PwaRegister />
          <SkipLink />
          <AuthListener />
          <Header />
          <main
            id="main-content"
            tabIndex={-1}
            className="btw-main mt-6 sm:mt-10 container mx-auto max-w-6xl px-4 sm:px-5 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
          >
            {children}
          </main>
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
