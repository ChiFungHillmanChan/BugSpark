import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Providers } from "@/providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BugSpark Dashboard",
  description: "Bug reporting and tracking dashboard",
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
        <Script
          src="https://unpkg.com/@bugspark/widget@0.1.0/dist/bugspark.iife.js"
          data-api-key="bsk_pub_a49e6629571e475f7b9377091cf440ae"
          data-endpoint="https://bugspark-api.onrender.com/api/v1"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
