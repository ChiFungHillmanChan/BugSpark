import type { NextConfig } from "next";
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

export default withNextIntl(withMDX(nextConfig));
