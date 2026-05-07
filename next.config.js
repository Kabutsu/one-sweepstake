/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["react-router-dom"],
  async rewrites() {
    return {
      beforeFiles: [
        // Don't rewrite API routes
        {
          source: "/api/:path*",
          destination: "/api/:path*",
        },
      ],
      afterFiles: [
        // Rewrite all other routes to the index for SPA routing
        {
          source: "/:path*",
          destination: "/",
        },
      ],
    };
  },
};

module.exports = nextConfig;
