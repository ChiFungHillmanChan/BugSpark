import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import FeaturesContent from "./features-content";

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata({
    titleZh: "功能特色 - 螢幕截圖、主控台日誌、AI 分析",
    titleEn: "Features - Screenshots, Console Logs, AI Analysis",
    descriptionZh:
      "BugSpark 提供螢幕截圖標註、主控台日誌擷取、網路請求追蹤、工作階段重播、AI 智慧分析等功能，全方位捕捉和修復錯誤。",
    descriptionEn:
      "Screenshots with annotations, console logs, network requests, session replay, AI analysis and more. Everything you need to capture and fix bugs.",
    path: "/features",
  });
}

const featuresJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "BugSpark Features",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Screenshot Capture with Annotations" },
    { "@type": "ListItem", position: 2, name: "Console Log Capture" },
    { "@type": "ListItem", position: 3, name: "Network Request Tracking" },
    { "@type": "ListItem", position: 4, name: "Session Replay" },
    { "@type": "ListItem", position: 5, name: "Device & Browser Info" },
    { "@type": "ListItem", position: 6, name: "Webhook Integrations" },
    { "@type": "ListItem", position: 7, name: "AI-Powered Analysis" },
    { "@type": "ListItem", position: 8, name: "Custom Branding" },
  ],
};

export default function FeaturesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(featuresJsonLd) }}
      />
      <FeaturesContent />
    </>
  );
}
