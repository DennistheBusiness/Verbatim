import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    // Prevent circular-reference TDZ errors from framer-motion and vaul
    // when those packages share bundle chunks with other components.
    optimizePackageImports: ['framer-motion', 'vaul'],
  },
  // Required so PostHog trailing-slash rewrites work correctly
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      // Proxy PostHog through our own domain to bypass ad blockers
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/decide',
        destination: 'https://us.i.posthog.com/decide',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: false,
})
