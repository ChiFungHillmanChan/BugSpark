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

export default function FeaturesPage() {
  return <FeaturesContent />;
}
