/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@toland/shared'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
};

export default nextConfig;
