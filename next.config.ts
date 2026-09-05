import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: false,

    transpilePackages: ["blink-secure-links"],
};

export default nextConfig;
