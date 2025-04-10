import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    experimental: {
        viewTransition: true,
    },
};

export default nextConfig;
