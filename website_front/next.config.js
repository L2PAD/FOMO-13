/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: __dirname,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  compiler: {
    styledComponents: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
      {
        protocol: "https",
        hostname: "zycrypto.com",
      },
      {
        protocol: "https",
        hostname: "api.fomo.cx",
      },
      {
        protocol: "https",
        hostname: "devapi.fomo.cx",
      },
      {
        protocol: "https",
        hostname: "assets.fomo.cx",
      },
      {
        protocol: "https",
        hostname: "dev-assets.fomo.cx",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "localhost",
      },
    ],
  },

  async redirects() {
    return [
      {
        source: "/crypto",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
