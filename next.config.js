/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  // Remove any server-side features since we're using static export
  trailingSlash: true,
};

module.exports = nextConfig;