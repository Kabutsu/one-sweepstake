/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["react-router-dom"],
  images: {
    remotePatterns: [new URL("https://crests.football-data.org/**")],
  },
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
