/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'res.cloudinary.com',
        },
        {
          protocol: 'https',
          hostname: 'storage.yandexcloud.net',
        },
      ],
    },
  };
  
  module.exports = nextConfig;
  