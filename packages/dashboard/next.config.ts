import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import createMDX from "@next/mdx";
import createNextIntlPlugin from "next-intl/plugin";
import remarkGfm from "remark-gfm";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm],
  },
});

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  poweredByHeader: false,
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/**",
      },
      ...(process.env.NEXT_PUBLIC_S3_HOSTNAME
        ? [
            {
              protocol: "https" as const,
              hostname: process.env.NEXT_PUBLIC_S3_HOSTNAME,
              pathname: "/**",
            },
          ]
        : []),
    ],
  },
};

export default withSentryConfig(withNextIntl(withMDX(nextConfig)), {
  // Suppresses source map upload logs during build
  silent: true,
  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
});
