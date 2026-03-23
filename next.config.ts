import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  // Smaller client bundles for icon libraries
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
