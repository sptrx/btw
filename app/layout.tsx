import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Header from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthListener } from "@/components/auth-listener";
import { SkipLink } from "@/components/skip-link";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: {
    template: "%s | BTW",
    default: "BTW - Faith-Based Social Platform",
  },
  description:
    "A Christian faith-based social platform with AI filtering for safe, encouraging community.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f3f0" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)} suppressHydrationWarning>
      <body
        className={cn(inter.className, "min-h-dvh pb-[env(safe-area-inset-bottom)]")}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <SkipLink />
          <AuthListener />
          <Header />
          <main
            id="main-content"
            tabIndex={-1}
            className="mt-6 sm:mt-10 container mx-auto max-w-6xl px-4 sm:px-5 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
          >
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
