import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/lib/language/request.ts');

const nextConfig: NextConfig = {
  output: 'standalone',
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
  // Exclude native @next/swc platform binaries from the standalone bundle
  // to keep the Docker image small (only the current platform's binary is needed at runtime).
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@next/swc-*',
      'node_modules/@swc/core-*',
    ],
  },
}

export default withNextIntl(nextConfig)
