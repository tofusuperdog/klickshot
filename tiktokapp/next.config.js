/** @type {import('next').NextConfig} */
const isTikTokMinisBuild = process.env.TIKTOK_MINIS_BUILD === "1";

const nextConfig = {
  ...(isTikTokMinisBuild
    ? {
        output: "export",
        images: {
          unoptimized: true,
        },
      }
    : {}),
  allowedDevOrigins: [
    "dev.minchapseries.com",
    "*.minchapseries.com",
    "192.168.0.138",
  ],
};

module.exports = nextConfig;
