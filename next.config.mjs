/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // 10 MiB files plus multipart metadata; uploadNote still validates file size.
    serverActions: { bodySizeLimit: "11mb" },
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
