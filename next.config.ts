import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Launch photography is pre-optimized locally so the Cloudflare Worker does
    // not depend on an image-transformation binding to render the page.
    unoptimized: true,
  },
};

export default nextConfig;
