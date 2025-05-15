/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  experimental: {
    allowedDevOrigins: ['http://192.168.1.41:3000'],
  },
}

export default nextConfig