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
        {process.env.NEXT_PUBLIC_BUGSPARK_API_KEY && (
          <Script
            src="https://unpkg.com/@bugspark/widget@0.2.0/dist/bugspark.iife.js"
            data-api-key={process.env.NEXT_PUBLIC_BUGSPARK_API_KEY}
            data-endpoint={process.env.NEXT_PUBLIC_API_URL ?? "https://bugspark-api.onrender.com/api/v1"}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
