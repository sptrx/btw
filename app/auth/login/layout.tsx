import type { Metadata } from "next";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = privatePageMetadata("Sign in");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
