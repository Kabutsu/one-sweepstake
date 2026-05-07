/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["react-router-dom"],
  async rewrites() {
    return [
      {
        source: "/((?!api).*)",
        destination: "/",
      },
    ];
  },
};

module.exports = nextConfig;
