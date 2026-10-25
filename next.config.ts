import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/lib/language/request.ts');

const cosImageHost = process.env.COS_IMAGE_HOST?.replace(/^https?:\/\//, '').split('/')[0];

const nextConfig: NextConfig = {
  output: 'standalone',
  // standalone 镜像未 bundled sharp 时保持 unoptimized；RemoteImage 仍统一懒加载与 sizes
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '**.myqcloud.com', pathname: '/**' },
      ...(cosImageHost
        ? [{ protocol: 'https' as const, hostname: cosImageHost, pathname: '/**' }]
        : []),
    ],
  },
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
