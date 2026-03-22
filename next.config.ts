import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/lib/language/request.ts');

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  // Exclude native @next/swc platform binaries from the Serverless Function bundle.
  // Vercel's static analyser would otherwise count the 142 MB win32 .node file
  // against the 100 MB Lambda size limit, causing a build failure.
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@next/swc-*',
      'node_modules/@swc/core-*',
    ],
  },
}

export default withNextIntl(nextConfig)
