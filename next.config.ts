import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {
    // Explicitly anchor Turbopack to this project directory so it doesn't
    // walk up into the parent folder to resolve node_modules.
    root: __dirname,
  },
}

export default nextConfig
