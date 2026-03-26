import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  // Avoid broken webpack vendor-chunks for Supabase on the server (e.g. missing ./vendor-chunks/@supabase.js)
  serverExternalPackages: ["@supabase/ssr", "@supabase/supabase-js"],
  // Smaller client bundles for icon libraries
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
