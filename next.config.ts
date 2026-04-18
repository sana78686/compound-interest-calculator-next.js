import type { NextConfig } from 'next'

/** Do not add rewrites for `/favicon.ico` — Next.js 15 already serves it from `src/app/icon.svg` and an extra rewrite can confuse routing + cache. */
const nextConfig: NextConfig = {}

export default nextConfig
