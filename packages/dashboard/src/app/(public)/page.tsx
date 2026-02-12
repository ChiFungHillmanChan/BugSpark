import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import { HeroSection } from "@/components/landing/hero-section";
import { FeatureHighlights } from "@/components/landing/feature-highlights";
import { WidgetDemoSection } from "@/components/landing/widget-demo-section";
import { IntegrationExamples } from "@/components/landing/integration-examples";
import { CtaSection } from "@/components/landing/cta-section";

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata({
    titleZh: "BugSpark - 香港最強 Bug 回報追蹤工具",
    titleEn: "BugSpark - Smart Bug Reporting & Tracking Tool",
    descriptionZh:
      "BugSpark 自動擷取螢幕截圖、主控台日誌、網路請求和工作階段資料，讓使用者回報更完整的錯誤，團隊以最快速度解決問題。香港開發者首選。",
    descriptionEn:
      "BugSpark automatically captures screenshots, console logs, network requests & session data so users report better bugs and teams fix them faster.",
    path: "/",
  });
}

const softwareAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "BugSpark",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  url: "https://bugspark.hillmanchan.com",
  description:
    "BugSpark 自動擷取螢幕截圖、主控台日誌、網路請求和工作階段資料，讓使用者回報更完整的錯誤，團隊以最快速度解決問題。",
  offers: [
    {
      "@type": "Offer",
      price: "0",
      priceCurrency: "HKD",
      name: "Free",
      description: "50 reports per month, screenshot capture, console logs",
    },
    {
      "@type": "Offer",
      price: "78",
      priceCurrency: "HKD",
      name: "Starter",
      description: "500 reports per month, all features",
    },
  ],
  author: {
    "@type": "Person",
    name: "Hillman Chan",
    url: "https://hillmanchan.com",
  },
};

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppJsonLd) }}
      />
      <HeroSection />
      <WidgetDemoSection />
      <FeatureHighlights />
      <IntegrationExamples />
      <CtaSection />
    </>
  );
}
