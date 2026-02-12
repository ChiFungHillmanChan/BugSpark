import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Providers } from "@/providers";
import { BUGSPARK_DASHBOARD_URL, BUGSPARK_API_URL, BUGSPARK_WIDGET_CDN_URL } from "@/lib/constants";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const BASE_URL = BUGSPARK_DASHBOARD_URL;

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "BugSpark - 香港 Bug 回報追蹤工具",
    template: "%s | BugSpark",
  },
  description:
    "BugSpark 自動擷取螢幕截圖、主控台日誌、網路請求和工作階段資料，讓團隊以最快速度解決 Bug。香港開發者首選錯誤追蹤工具。",
  openGraph: {
    type: "website",
    siteName: "BugSpark",
    locale: "zh_HK",
    alternateLocale: "en_US",
    url: BASE_URL,
  },
  twitter: {
    card: "summary_large_image",
  },
  alternates: {
    canonical: BASE_URL,
    languages: { "zh-HK": "/", en: "/" },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
        {process.env.NEXT_PUBLIC_BUGSPARK_API_KEY && (
          <Script
            src={BUGSPARK_WIDGET_CDN_URL}
            data-api-key={process.env.NEXT_PUBLIC_BUGSPARK_API_KEY}
            data-endpoint={BUGSPARK_API_URL}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
