import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Header from "@/components/header";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: "%s | BTW",
    default: "BTW - Faith-Based Social Platform",
  },
  description:
    "A Christian faith-based social platform with AI filtering for safe, encouraging community.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Header />
        <main className="mt-10">{children}</main>
      </body>
    </html>
  );
}
