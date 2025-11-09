import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: false,
    eslint: {
        ignoreDuringBuilds: true,
    },
    experimental: {
        viewTransition: true,
    },
    transpilePackages: ["blink-secure-links"],
};  

export default nextConfig;
